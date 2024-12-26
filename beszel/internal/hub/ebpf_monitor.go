package hub

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"golang.org/x/crypto/ssh"
)

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

// ebpf任务返回结果处理
func handle_receiver(receiver chan DataWithError, callback Callback) {
	for dwe := range receiver {
		switch dwe.Err {
		case nil:
			callback.process(dwe.Data)
		case io.EOF:
			callback.end()
			return
		default:
			callback.err(dwe.Err)
			return
		}
	}
}

// 这个只是测试用的，根据理想情况，应该是前端发出一个获取数据的请求后，在hub中拿到数据后发送回前端，更新页面
// 但是目前没有更新页面这一步，于是就写到一个log文件中
// 此文件放在beszel/beszel/cmd/hub/.log文件夹下，名字是"时间戳_命令.log"
func createLogFile(startTime string, command string) (string, error) {
	if startTime == "" || command == "" {
		return "", fmt.Errorf("startTime or command is empty")
	}

	currentDir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get current working directory: %v", err)
	}

	logDir := filepath.Join(currentDir, ".log")

	if err := os.MkdirAll(logDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create log directory: %v", err)
	}

	command = strings.ReplaceAll(command, " ", "_")
	fileName := filepath.Join(logDir, fmt.Sprintf("%s_%s.log", startTime, command))

	return fileName, nil
}

type Command struct {
	// 主命令: get_ebpf_data/stop_ebpf_session
	command string
	// 子命令: opensnoop/ssh_monitor,可以带参数如:socket_block,1.1.1.1(用逗号隔开)
	subcommand string
	// 运行时间: -1表示一直运行,正数表示运行多少秒
	timeout string
	// 是否后台运行: true表示后台运行,false表示前台运行(理论上都应该是后台运行,前台运行就是在shell中输出结果,并阻塞输入)
	background bool
	// 在哪个机器上运行: 如192.168.102.2
	ip string
}

func (c *Command) generate() string {
	return fmt.Sprintf("%s %s %s", c.command, c.subcommand, c.timeout)
}

// ebpf模块入口
func (h *Hub) start_ebpf_monitor(se *core.ServeEvent) error {
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
			c, err := get_input_commands(reader)
			if err != nil {
				fmt.Println("Error reading input", "err", err)
				continue
			}

			// 这里应该是根据前端的指令来决定回调函数,目前不知道前端怎么实现,就同一输出到log
			callback, err := get_log_callback(c)
			if err != nil {
				fmt.Println("Error creating log file", "err", err)
				continue
			}

			// 开始ebpf任务执行
			start_ebpf_task(h.sshClientConfig, c, callback)
		}
	}()

	return se.Next()
}

// 这是一个输出到log文件的回调函数
func get_log_callback(c Command) (Callback, error) {
	// 创建log文件
	startTime := time.Now().Format("20060102150405")
	fileName, err := createLogFile(startTime, c.generate())
	if err != nil {
		fmt.Println("Error creating log file", "err", err)
		return Callback{}, err
	}

	file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening log file", "err", err)
		return Callback{}, err
	}

	write_in_log := func(data string) {
		_, err := file.WriteString(data + "\n")
		if err != nil {
			fmt.Println("Error writing to log file", "err", err)
		}
	}

	// 设置回调函数
	callback := Callback{
		process: func(data string) {
			// 在前台执行则直接在shell中输出结果
			if !c.background {
				fmt.Println(data)
			}
			// 不管在不在前台都要写到log文件中,方便调试
			write_in_log(data)
		},
		end: func() {
			// 结束了就关闭log文件
			write_in_log("ebpf task success")
			file.Close()
		},
		err: func(err error) {
			// 出错了就先输出错误,然后写入log文件,并关闭log文件
			error_text := fmt.Sprintf("get ebpf data error: %e", err)
			fmt.Println(error_text)
			write_in_log(error_text)
			file.Close()
		},
	}

	return callback, nil
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

	ip := "192.168.102.2"

	return Command{command, subcommand, timeout, background, ip}, nil
}

// 执行ebpf任务,具体就是先通过ssh连接上机器,然后向agent传输指令,由agent调用对应脚本执行,并返回结果或者错误
func start_ebpf_task(config *ssh.ClientConfig, c Command, callback Callback) {

	// 创建ssh连接
	ebpfclient, err := ssh.Dial("tcp", net.JoinHostPort(c.ip, "45876"), config)
	if err != nil {
		println("get ssh client error: ", err)
		return
	}

	receiver := make(chan DataWithError)
	// 向agent发送指令
	go get_ebpf_data(ebpfclient, c, receiver)

	// 处理结果
	if c.background {
		go handle_receiver(receiver, callback)
	} else {
		handle_receiver(receiver, callback)
	}
}

// 向agent发送ebpf任务,并接收结果,将结果发送到receiver中进行处理
func get_ebpf_data(client *ssh.Client, c Command, receiver chan DataWithError) {
	defer client.Close()

	// 创建连接
	session, err := client.NewSession()
	if err != nil {
		receiver <- DataWithError{Err: err}
		return
	}
	defer session.Close()

	stdout, err := session.StdoutPipe()
	if err != nil {
		receiver <- DataWithError{Err: err}
		return
	}

	// 开始执行任务
	if err := session.Start(c.generate()); err != nil {
		receiver <- DataWithError{Err: err}
		return
	}

	// 将每一行结果发送到receiver中进行处理
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		text := scanner.Text()
		// 结束标志
		if text == "-------io.EOF------" {
			receiver <- DataWithError{Err: io.EOF}
			return
		}
		receiver <- DataWithError{Data: text}
	}

	// 等待任务执行完毕
	if err := session.Wait(); err != nil {
		receiver <- DataWithError{Err: err}
	}
}
