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

func createLogFile(startTime string, command string) (string, error) {
	// 确保 startTime 和 command 不为空
	if startTime == "" || command == "" {
		return "", fmt.Errorf("startTime or command is empty")
	}

	// 获取当前工作目录
	currentDir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get current working directory: %v", err)
	}

	// 拼接日志目录路径
	logDir := filepath.Join(currentDir, ".log")

	// 检查并创建 .log 目录
	if err := os.MkdirAll(logDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create log directory: %v", err)
	}

	// 拼接完整文件路径
	fileName := filepath.Join(logDir, fmt.Sprintf("%s_%s.txt", startTime, command))

	// 返回文件路径
	return fileName, nil
}

type Command struct {
	command    string
	subcommand string
	timeout    string
	background bool
	ip         string
}

func (c *Command) generate() string {
	return fmt.Sprintf("%s %s %s", c.command, c.subcommand, c.timeout)
}

type Callback struct {
	process func(string)
	end     func()
	error   func(error)
}

func (h *Hub) start_ebpf_monitor(se *core.ServeEvent) error {
	go func() {
		time.Sleep(2 * time.Second)

		reader := bufio.NewReader(os.Stdin)

		for {
			// 通过socket连接前端，前端发送一个指令，在这里接收到后执行对应处理
			c, err := get_input_commands(reader)
			if err != nil {
				fmt.Println("Error reading input", "err", err)
				continue
			}

			callback, err := get_log_callback(c)
			if err != nil {
				fmt.Println("Error creating log file", "err", err)
				continue
			}

			start_ebpf_task(h.sshClientConfig, c, callback)
		}
	}()

	return se.Next()
}

func get_log_callback(c Command) (Callback, error) {
	startTime := time.Now().Format("20060102150405") // 格式化开始时间
	fileName, err := createLogFile(startTime, c.command)
	if err != nil {
		fmt.Println("Error creating log file", "err", err)
		return Callback{}, err
	}

	file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening log file", "err", err)
		return Callback{}, err
	}

	callback := Callback{
		process: func(data string) {
			if !c.background {
				fmt.Println(data)
			}
			_, err := file.WriteString(data + "\n")
			if err != nil {
				fmt.Println("Error writing to log file", "err", err)
			}
		},
		end: func() {
			file.Close()
		},
		error: func(err error) {
			fmt.Println("Error writing to log file", "err", err)
			file.Close()
		},
	}

	return callback, nil
}
func get_input_commands(reader *bufio.Reader) (Command, error) {
	fmt.Print("Enter command (get_ebpf_data opensnoop/ssh_monitor or stop_ebpf_session) and timeout : \n")
	fmt.Print("Enter command (get_ebpf_data socket_block,1.1.1.1) : \n")
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

	return Command{command, subcommand, timeout, background, "192.168.102.2"}, nil
}

func start_ebpf_task(config *ssh.ClientConfig, c Command, callback Callback) {

	ebpfclient, err := ssh.Dial("tcp", net.JoinHostPort(c.ip, "45876"), config)
	if err != nil {
		println("get ssh client error: ", err)
		return
	}
	// println("connect ssh success")

	receiver := make(chan DataWithError)
	go get_ebpf_data(ebpfclient, c, receiver)

	if c.background {
		go handle_receiver(receiver, callback)
	} else {
		handle_receiver(receiver, callback)
	}
}

func handle_receiver(receiver chan DataWithError, callback Callback) {
	for dwe := range receiver {
		switch dwe.Err {
		case nil:
			callback.process(dwe.Data)
		case io.EOF:
			callback.end()
			return
		default:
			callback.error(dwe.Err)
			return
		}
	}
}

func get_ebpf_data(client *ssh.Client, c Command, receiver chan DataWithError) {
	defer client.Close()

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

	if err := session.Start(c.generate()); err != nil {
		receiver <- DataWithError{Err: err}
		return
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		text := scanner.Text()
		if text == "-------io.EOF------" {
			receiver <- DataWithError{Err: io.EOF}
			return
		}
		receiver <- DataWithError{Data: text}
	}

	// println("getting ebpf data finish")

	// wait for the session to complete
	if err := session.Wait(); err != nil {
		receiver <- DataWithError{Err: err}
	}

}
