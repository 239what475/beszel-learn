#!/usr/bin/python
from bcc import BPF
import subprocess

prog = """
#include <linux/fs.h>
#include <linux/sched.h>
#include <linux/dcache.h>
#include <asm/ptrace.h>
#include <linux/string.h>

struct data_t {
    char filename[20];
    char content[256];
};

BPF_PERF_OUTPUT(events);

int trace_vfs_write(struct pt_regs *ctx, struct file *file, const char __user *buf, size_t count, loff_t *pos)
{
    struct data_t data = {};

    // 安全地读取文件名
    struct qstr name = file->f_path.dentry->d_name;
    if (name.len > sizeof(data.filename) - 1) {
        name.len = sizeof(data.filename) - 1;
    }
    bpf_probe_read_kernel(&data.filename, sizeof(data.filename), (void *)name.name);

    // 检查文件名是否为 "auth.log"
    if (strcmp(data.filename, "auth.log") == 0) {
        // 安全地读取写入的内容
        size_t len = count < 256 ? count : 256;
        bpf_probe_read_user(&data.content, len, (void *)buf);

        events.perf_submit(ctx, &data, sizeof(data));
    }

    return 0;
}
"""

# 加载 eBPF 程序
b = BPF(text=prog)

# 挂钩到 vfs_write 系统调用
b.attach_kprobe(event="vfs_write", fn_name="trace_vfs_write")

# 定义 Python 函数来处理从 eBPF 收集的数据
def print_event(cpu, data, size):
    event = b["events"].event(data)
    content = event.content.decode()
    filename = event.filename.decode()
    if "authentication failure" in content or "Failed password" in content:
        print(f"register warning !!!: Content: {content}")
    
# 开始监听事件
b["events"].open_perf_buffer(print_event)

try:
    while True:
        b.perf_buffer_poll(timeout=-1)
except KeyboardInterrupt:
    print("\nDetaching...")