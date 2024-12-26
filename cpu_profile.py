#!/usr/bin/env python

from __future__ import print_function
from bcc import BPF, PerfType, PerfSWConfig
from bcc.containers import filter_by_containers
from sys import stderr
from time import sleep
import argparse
import signal
import os
import errno


# arg validation
def positive_int(val):
    try:
        ival = int(val)
    except ValueError:
        raise argparse.ArgumentTypeError("must be an integer")

    if ival < 0:
        raise argparse.ArgumentTypeError("must be positive")
    return ival

def positive_nonzero_int(val):
    ival = positive_int(val)
    if ival == 0:
        raise argparse.ArgumentTypeError("must be nonzero")
    return ival

def stack_id_err(stack_id):
    # -EFAULT in get_stackid normally means the stack-trace is not available,
    # Such as getting kernel stack trace in userspace code
    return (stack_id < 0) and (stack_id != -errno.EFAULT)

parser = argparse.ArgumentParser(
    description="Profile CPU stack traces at a timed interval",
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("duration", nargs="?", default=10,
    type=positive_nonzero_int,
    help="duration of trace, in seconds")
parser.add_argument("--cgroupmap",
    help="trace cgroups in this BPF map only")
parser.add_argument("--mntnsmap",
    help="trace mount namespaces in this BPF map only")

# option logic
args = parser.parse_args()
duration = int(args.duration)

#
# Setup BPF
#

# define BPF program
bpf_text = """
#include <uapi/linux/ptrace.h>
#include <uapi/linux/bpf_perf_event.h>
#include <linux/sched.h>

struct key_t {
    u32 pid;
    u64 kernel_ip;
    int user_stack_id;
    int kernel_stack_id;
    char name[TASK_COMM_LEN];
};
BPF_HASH(counts, struct key_t, u64, 40960);
BPF_STACK_TRACE(stack_traces, 16384);

// This code gets a bit complex. Probably not suitable for casual hacking.

int do_perf_event(struct bpf_perf_event_data *ctx) {
    u32 tgid = 0;
    u32 pid = 0;

    struct bpf_pidns_info ns = {};
    // 根据是否在容器中,获取pid和tgid
    if (!bpf_get_ns_current_pid_tgid(PIDNS_DEV, PIDNS_INO, &ns, sizeof(struct bpf_pidns_info))) {
        tgid = ns.tgid;
        pid = ns.pid;
    } else {
        u64 id = bpf_get_current_pid_tgid();
        tgid = id >> 32;
        pid = id;
    }

    // 过滤空闲进程
    if (pid == 0)
        return 0;

    // ?
    if (container_should_be_filtered()) {
        return 0;
    }

    // 获取进程名
    struct key_t key = {.pid = tgid};
    bpf_get_current_comm(&key.name, sizeof(key.name));

    // 获取函数栈
    key.user_stack_id = stack_traces.get_stackid(&ctx->regs, BPF_F_USER_STACK);
    key.kernel_stack_id = stack_traces.get_stackid(&ctx->regs, 0);

    if (key.kernel_stack_id >= 0) {
        // populate extras to fix the kernel stack
        u64 ip = PT_REGS_IP(&ctx->regs);
        u64 page_offset = __PAGE_OFFSET_BASE_L4;

        if (ip > page_offset) {
            key.kernel_ip = ip;
        }
    }

    counts.increment(key);
    return 0;
}
"""

# pid-namespace translation
try:
    devinfo = os.stat("/proc/self/ns/pid")
    bpf_text = bpf_text.replace('PIDNS_DEV', str(devinfo.st_dev))
    bpf_text = bpf_text.replace('PIDNS_INO', str(devinfo.st_ino))
except:
    bpf_text = bpf_text.replace('PIDNS_DEV', "0")
    bpf_text = bpf_text.replace('PIDNS_INO', "0")


bpf_text = filter_by_containers(args) + bpf_text

sample_freq = 49

# initialize BPF & perf_events
b = BPF(text=bpf_text)
b.attach_perf_event(ev_type=PerfType.SOFTWARE,
    ev_config=PerfSWConfig.CPU_CLOCK, fn_name="do_perf_event",
    sample_freq=sample_freq, )

sleep(duration)

# output stacks
counts = b.get_table("counts")
stack_traces = b.get_table("stack_traces")
for k, v in sorted(counts.items(), key=lambda counts: counts[1].value):

    user_stack = [] if k.user_stack_id < 0 else stack_traces.walk(k.user_stack_id)
    kernel_tmp = [] if k.kernel_stack_id < 0 else stack_traces.walk(k.kernel_stack_id)

    # fix kernel stack
    kernel_stack = []
    if k.kernel_stack_id >= 0:
        for addr in kernel_tmp:
            kernel_stack.append(addr)
        # the later IP checking
        if k.kernel_ip:
            kernel_stack.insert(0, k.kernel_ip)

    # print folded stack output
    user_stack = list(user_stack)
    kernel_stack = list(kernel_stack)
    line = [k.name.decode('utf-8', 'replace')]
    # if we failed to get the stack is, such as due to no space (-ENOMEM) or
    # hash collision (-EEXIST), we still print a placeholder for consistency
    
    if stack_id_err(k.user_stack_id):
        line.append("[Missed User Stack]")
    else:
        line.extend([b.sym(addr, k.pid).decode('utf-8', 'replace') for addr in reversed(user_stack)])
    line.extend([])
    if stack_id_err(k.kernel_stack_id):
        line.append("[Missed Kernel Stack]")
    else:
        line.extend([b.ksym(addr).decode('utf-8', 'replace') for addr in reversed(kernel_stack)])
    print("%s %d" % (";".join(line), v.value))