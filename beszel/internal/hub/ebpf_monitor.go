package hub

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"golang.org/x/crypto/ssh"
)

type DataWithError struct {
	Data string
	Err  error
}

func (h *Hub) start_ebpf_monitor(se *core.ServeEvent) error {
	go func() {
		time.Sleep(2 * time.Second)

		reader := bufio.NewReader(os.Stdin)

		for {
			fmt.Print("Enter command (opensnoop,ssh_monitor) and timeout : ")
			input, err := reader.ReadString('\n')
			if err != nil {
				fmt.Println("An error occurred while reading input. Please try again", err)
				continue
			}

			// 去除输入字符串中的换行符
			input = strings.TrimSpace(input)

			fields := strings.Fields(input)

			if len(fields) < 2 {
				fmt.Println("Invalid input. Please enter a command and a timeout.")
				continue
			}

			command := fields[0]
			timeoutStr := fields[1]

			receiver := ebpf_func("192.168.102.2", h.sshClientConfig, command, timeoutStr)
		outer:
			for dwe := range receiver {
				switch dwe.Err {
				case nil:
					fmt.Println(dwe.Data)
				case io.EOF:
					fmt.Println("接收结束")
					break outer
				default:
					fmt.Println("error: ", dwe.Err)
					break outer
				}
			}
		}
	}()

	return se.Next()
}

func ebpf_func(ip string, config *ssh.ClientConfig, f string, t string) chan DataWithError {
	ebpfclient, err := ssh.Dial("tcp", net.JoinHostPort(ip, "45876"), config)
	if err != nil {
		println("get ssh client error: ", err)
		return nil
	}
	println("connect ssh success")

	receiver := make(chan DataWithError)
	go get_ebpf_data(ebpfclient, f, t, receiver)
	return receiver
}

func get_ebpf_data(client *ssh.Client, f string, t string, receiver chan DataWithError) {
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

	fullCommand := fmt.Sprintf("get_ebpf_data %s %s", f, t)

	println("starting ebpf command:", fullCommand)
	if err := session.Start(fullCommand); err != nil {
		receiver <- DataWithError{Err: err}
		return
	}

	println("getting ebpf data:")

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		text := scanner.Text()
		if text == "-------io.EOF------" {
			receiver <- DataWithError{Err: io.EOF}
			return
		}
		receiver <- DataWithError{Data: text}
	}

	println("getting ebpf data finish")

	// wait for the session to complete
	if err := session.Wait(); err != nil {
		receiver <- DataWithError{Err: err}
	}

}
