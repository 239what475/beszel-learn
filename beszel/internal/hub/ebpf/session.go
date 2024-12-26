package ebpf

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"

	"golang.org/x/crypto/ssh"
)

// 执行ebpf任务,具体就是先通过ssh连接上机器,然后向agent传输指令,由agent调用对应脚本执行,并返回结果或者错误
func start_ebpf_task(config *ssh.ClientConfig, c Command, callback Callback) {
	logFile, err := create_log_file(c)
	if err != nil {
		println("Error creating log file", "err", err)
		return
	}

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
		go handle_receiver(logFile, receiver, callback)
	} else {
		handle_receiver(logFile, receiver, callback)
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

// ebpf任务返回结果处理,并在log中记录
func handle_receiver(logFile *os.File, receiver chan DataWithError, callback Callback) {
	for dwe := range receiver {
		switch dwe.Err {
		case nil:
			callback.process(dwe.Data)
			write_in_log(logFile, dwe.Data)
		case io.EOF:
			callback.end()
			write_in_log(logFile, "ebpf task success")
			logFile.Close()
			return
		default:
			callback.err(dwe.Err)
			write_in_log(logFile, fmt.Sprintf("ebpf task failed: %e", dwe.Err))
			logFile.Close()
			return
		}
	}
}
