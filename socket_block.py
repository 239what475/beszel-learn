#!/usr/bin/python

import time
from bcc import BPF
import argparse

# 将IP地址转换为整数形式
def ip_to_u32(ip):
    parts = list(map(int, ip.split('.')))
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]

# 定义命令行参数解析器
parser = argparse.ArgumentParser(description="Block connections to specified IP addresses.")
parser.add_argument("ips", type=str, nargs='*', help="The IP addresses to block (e.g., 1.1.1.1 8.8.8.8)")
args = parser.parse_args()

# 将IP地址转换为整数形式的数组
blocked_ips = [ip_to_u32(ip) for ip in args.ips] if args.ips else []

# 将整数形式的IP地址数组转换为C数组格式
blocked_ips_c_array = ", ".join(map(str, blocked_ips))

# 将整数形式的IP地址转换为点分十进制形式
def u32_to_ip(u32):
    return f"{(u32 >> 24) & 0xFF}.{(u32 >> 16) & 0xFF}.{(u32 >> 8) & 0xFF}.{u32 & 0xFF}"

# 定义eBPF程序
bpf_text = f"""
#include <uapi/linux/ptrace.h>
#include <linux/socket.h>
#include <linux/in.h>

#define AF_INET 2
#define EPERM 1

const __u32 blocked_ips[] = {{{blocked_ips_c_array}}};
const __u32 blocked_ips_count = {len(blocked_ips)};

#include <uapi/asm-generic/errno-base.h>
LSM_PROBE(socket_connect, struct socket *sock, struct sockaddr *address, int addrlen)
{{
    // 只处理IPv4连接
    if (address->sa_family != AF_INET) {{
        return 0;
    }}

    // 铸造成IPv4地址结构体
    struct sockaddr_in *addr = (struct sockaddr_in *)address;

    // 目标地址是哪里？
    __u32 dest = addr->sin_addr.s_addr;
    bpf_trace_printk("lsm: found connect to %d\\n", dest);

    // 检查目标地址是否在被阻止的IP地址列表中
    for (__u32 i = 0; i < blocked_ips_count; i++) {{
        if (dest == blocked_ips[i]) {{
            bpf_trace_printk("lsm: blocking %d\\n", dest);
            return -EPERM;
        }}
    }}
    return 0;
}}
"""

# 加载BPF程序
b = BPF(text=bpf_text)

print(f"Blocking connections to {', '.join(args.ips)}... Press Ctrl+C to exit.")

# 解析trace_fields返回的数据
def parse_trace_fields(data):
    comm, pid, cpu, flags, ts, msg = data
    comm = comm.decode('utf-8').strip()
    msg = msg.decode('utf-8').strip()

    # 根据空格切分 msg
    parts = msg.split()

    # 将最后一个部分转换为 u32
    u32_value = int(parts[-1])

    # 调用 u32_to_ip 函数转换成 IP 地址
    ip_address = u32_to_ip(u32_value)

    # 将转换后的 IP 地址与之前的部分重新连接起来
    parts[-1] = ip_address
    new_msg = ' '.join(parts)

    return {
        'comm': comm,
        'pid': pid,
        'cpu': cpu,
        'flags': flags,
        'ts': ts,
        'msg': new_msg
    }

# 保持程序运行
try:
    while True:
        # 打印调试信息
        data = b.trace_fields()
        if data:
            # print(data)
            parsed_data = parse_trace_fields(data)
            print(f"Comm: {parsed_data['comm']}, PID: {parsed_data['pid']}, CPU: {parsed_data['cpu']}, TS: {parsed_data['ts']}, Msg: {parsed_data['msg']}")
        time.sleep(0.1)
except KeyboardInterrupt:
    print("Detaching...")