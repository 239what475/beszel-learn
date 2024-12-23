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

func (h *Hub) start_ebpf_monitor(se *core.ServeEvent) error {
	go func() {
		time.Sleep(2 * time.Second)

		reader := bufio.NewReader(os.Stdin)

		for {
			fmt.Print("Enter command (get_ebpf_data opensnoop/ssh_monitor or stop_ebpf_session) and timeout : \n")
			input, err := reader.ReadString('\n')
			if err != nil {
				fmt.Println("An error occurred while reading input. Please try again", err)
				continue
			}

			// 去除输入字符串中的换行符
			input = strings.TrimSpace(input)

			fields := strings.Fields(input)

			if len(fields) < 3 {
				fmt.Println("Invalid input. Please enter a command, a subcommand and a timeout.")
				continue
			}

			command := fields[0]
			subcommand := fields[1]
			timeoutStr := fields[2]

			startTime := time.Now().Format("20060102150405") // 格式化开始时间
			fileName, err := createLogFile(startTime, command)
			if err != nil {
				fmt.Println("Error creating log file", "err", err)
				return
			}

			file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err != nil {
				fmt.Println("Error opening log file", "err", err)
				return
			}

			fun := func(data string) error {
				_, err := file.WriteString(data + "\n") // 将数据写入文件
				return err
			}

			start_ebpf_task("192.168.102.2", h.sshClientConfig, command, subcommand, timeoutStr, len(fields) == 4, fun)
		}
	}()

	return se.Next()
}

func start_ebpf_task(ip string, config *ssh.ClientConfig, command string, subcommand string, t string, show bool, fun func(string) error) {

	ebpfclient, err := ssh.Dial("tcp", net.JoinHostPort(ip, "45876"), config)
	if err != nil {
		println("get ssh client error: ", err)
		return
	}
	// println("connect ssh success")

	receiver := make(chan DataWithError)
	go get_ebpf_data(ebpfclient, command, subcommand, t, receiver)

	if show {
		handle_receiver(receiver, show, fun)
	} else {
		go handle_receiver(receiver, show, fun)
	}
}

func handle_receiver(receiver chan DataWithError, show bool, fun func(string) error) {
	for dwe := range receiver {
		switch dwe.Err {
		case nil:
			err := fun(dwe.Data)
			if err != nil {
				fmt.Println("error: ", err)
				return
			}

			if show {
				fmt.Println(dwe.Data)
			}
		case io.EOF:
			// fmt.Println("接收结束")
			return
		default:
			fmt.Println("error: ", dwe.Err)
			return
		}
	}
}

func get_ebpf_data(client *ssh.Client, command string, subcommand string, t string, receiver chan DataWithError) {
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

	fullCommand := fmt.Sprintf("%s %s %s", command, subcommand, t)

	if err := session.Start(fullCommand); err != nil {
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
