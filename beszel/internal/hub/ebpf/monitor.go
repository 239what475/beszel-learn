package ebpf

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"golang.org/x/crypto/ssh"
)

// ebpf模块入口
func Start_ebpf_monitor(sshClientConfig *ssh.ClientConfig, se *core.ServeEvent) error {
	go func() {
		// 停两秒的原因是让shell中的网址先输出,避免调试时视觉干扰,可以删掉这一行
		time.Sleep(2 * time.Second)

		// 这里由于还没有前端,因此采用在shell中手动输入命令
		reader := bufio.NewReader(os.Stdin)

		for {
			// 理想情况是通过socket连接前端，前端发送一个指令，在这里接收到后执行对应处理
			// 目前就接收shell中手动输入的命令并解析
			// 输入格式: get_ebpf_data opensnoop 10 show (表示运行opensnoop命令,10秒后结束,并在当前shell中输出结果,阻塞输入)
			// 输入格式: get_ebpf_data socket_block,1.1.1.1 10 show (表示运行socket_block命令,1.1.1.1为参数,10秒后结束,并在当前shell中输出结果,阻塞输入)
			// 输入格式: get_ebpf_data ssh_monitor -1 (表示运行ssh_monitor命令,一直运行,不阻塞输入,在后台执行)
			// 输入格式: stop_ebpf_session opensnoop (表示停止opensnoop命令)
			// TODO: 输入格式: stop_ebpf_session all (表示停止所有ebpf命令)

			// 输入格式：get_ebpf_data oom_monitor -1 show（表示监控oom）
			// 输入格式：get_ebpf_data cpu_profile 5 show（监控线程栈，输出为svg图片，需要FlameGraph）
			// 上面两个可以用stress-ng测试
			c, err := get_input_commands(reader)
			if err != nil {
				fmt.Println("Error reading input", "err", err)
				continue
			}

			var callback Callback

			// 特定指令可能有特定实现
			if strings.HasPrefix(c.subcommand, "cpu_profile") {
				callback, err = cpu_profiler_callback(c)
				if err != nil {
					fmt.Println("Error in cpu_profiler", "err", err)
					continue
				}
			} else {
				// 默认情况
				callback = Callback{
					process: func(data string) {
						// 在前台执行则直接在shell中输出结果
						if !c.background {
							fmt.Println(data)
						}
					},
					end: func() {
					},
					err: func(err error) {
						fmt.Println("run ebpf task (", c.generate(), ") error : ", err)
					},
				}
			}

			// 开始ebpf任务执行
			start_ebpf_task(sshClientConfig, c, callback)
		}
	}()

	return se.Next()
}

// 解析输入的命令
func get_input_commands(reader *bufio.Reader) (Command, error) {
	fmt.Println("command example : get_ebpf_data opensnoop 10 show")
	fmt.Println("command example : get_ebpf_data socket_block,1.1.1.1 10 show")
	fmt.Println("command example : get_ebpf_data ssh_monitor -1")
	fmt.Println("command example : stop_ebpf_session opensnoop")
	fmt.Println("please input a command:")
	input, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("An error occurred while reading input. Please try again", err)
		return Command{}, err
	}

	// 去除输入字符串中的换行符
	input = strings.TrimSpace(input)

	fields := strings.Fields(input)

	if len(fields) < 2 {
		fmt.Println("Invalid input. Please at least enter a command, a subcommand.")
		return Command{}, err
	}

	command := fields[0]
	subcommand := fields[1]

	timeout := "-1"
	if len(fields) >= 3 {
		timeout = fields[2]
	}

	background := true
	if len(fields) >= 4 {
		background = false
	}

	ip := "192.168.23.128"

	return Command{command, subcommand, timeout, background, ip}, nil
}
