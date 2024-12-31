package ebpf

import "fmt"

type DataWithError struct {
	Data string
	Err  error
}

type Callback struct {
	// 每次接收到数据的回调函数,每次接收都是一行
	process func(string)
	// 结束回调函数
	end func()
	// 错误回调函数,现在是出现错误就退出当前命令执行
	err func(error)
}

type Command struct {
	// 在哪个机器上运行: 如192.168.102.2
	ip string
	// 主命令: get_ebpf_data/stop_ebpf_session
	command string
	// 子命令: opensnoop/ssh_monitor,可以带参数如:socket_block,1.1.1.1(用逗号隔开)
	subcommand string
	// 运行时间: -1表示一直运行,正数表示运行多少秒
	timeout string
}

func (c *Command) generate() string {
	return fmt.Sprintf("%s %s %s", c.command, c.subcommand, c.timeout)
}
