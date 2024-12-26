package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	sshServer "github.com/gliderlabs/ssh"
)

func (a *Agent) startServer(pubKey []byte, addr string) {
	sshServer.Handle(a.handleSession)

	slog.Info("Starting SSH server", "address", addr)
	if err := sshServer.ListenAndServe(addr, nil, sshServer.NoPty(),
		sshServer.PublicKeyAuth(func(ctx sshServer.Context, key sshServer.PublicKey) bool {
			allowed, _, _, _, _ := sshServer.ParseAuthorizedKey(pubKey)
			return sshServer.KeysEqual(key, allowed)
		}),
	); err != nil {
		slog.Error("Error starting SSH server", "err", err)
		os.Exit(1)
	}
}

type EbpfSession struct {
	// 剩下的执行时间
	remain_time time.Duration
	// 任务取消函数
	cancel context.CancelFunc
}

var exist_ebpf_session = map[string]*EbpfSession{}

func (a *Agent) handleSession(s sshServer.Session) {
	commands := s.Command()

	if len(commands) == 0 {
		// 这里是原来的beszel默认功能，就是搜集一些数据并返回
		stats := a.gatherStats()
		if err := json.NewEncoder(s).Encode(stats); err != nil {
			slog.Error("Error encoding stats", "err", err)
			s.Exit(0)
			return
		}
		s.Exit(0)
	} else if len(commands) == 3 && commands[0] == "get_ebpf_data" {
		// 下面是get_ebpf_data功能，执行一个bcc脚本，每当有数据输出就返回

		// 解析命令，得到执行的脚本名
		subcommands := strings.Split(commands[1], ",")
		scriptName := fmt.Sprintf("%s.py", subcommands[0])
		script, exist := exist_ebpf_session[scriptName]

		// 如果该任务已经存在，就返回
		if exist {
			output := fmt.Sprintf("script already run, remain time: %.2f s\n", script.remain_time.Seconds())
			println(output)
			s.Write([]byte(output))
			s.Write([]byte("-------io.EOF------"))
			s.Exit(0)
			return
		}

		// 生成要执行的脚本的详细命令，就是将用逗号隔离开的参数用空格连接起来
		// 比如 socket_block,1.1.1.1 -> python -u socket_block.py 1.1.1.1
		fullCommand := fmt.Sprintf("python -u %s", scriptName)
		if len(subcommands) > 1 {
			params := strings.Join(subcommands[1:], " ")
			fullCommand = fmt.Sprintf("%s %s", fullCommand, params)
		}

		// 设置退出上下文，用于控制执行时长
		ctx, cancel := context.WithCancel(context.Background())

		// 解析得到执行时间
		timeout, _ := strconv.Atoi(commands[2])
		timeoutDuration := time.Duration(timeout) * time.Second

		// 保存执行记录
		exist_ebpf_session[scriptName] = &EbpfSession{
			remain_time: timeoutDuration,
			cancel:      cancel,
		}

		println("timeout: ", timeout, " s")

		// 理论上这里应该是不会执行的
		// defer cancel()

		// 检查文件是否存在
		if _, err := os.Stat(scriptName); os.IsNotExist(err) {
			fmt.Printf("文件 %s 不存在\n", scriptName)
			s.Write([]byte(fmt.Sprintf("文件 %s 不存在\n", scriptName)))
			s.Exit(1)
			return
		}

		// 创建命令，并获取输出管道
		c := exec.CommandContext(ctx, "bash", "-c", fullCommand)
		stdout, err := c.StdoutPipe()
		if err != nil {
			return
		}

		// 发送数据，并处理出错的情况的函数，返回值为是否出现了错误。（通常出错的原因是hub端断开）
		// 如果出现了错误就返回true，并删除本地执行记录
		// 如果没有出错就返回false
		send_error := func(data string) bool {
			_, err := s.Write([]byte(data))
			if err != nil {
				// 出错了一定退出,并删除本地执行记录
				fmt.Println("send data error : ", err)
				delete(exist_ebpf_session, scriptName)
				return true
			}
			return false
		}

		// 在第一次拿到bcc脚本输出时开始即使，因为bcc的编译时间有点久
		start_send := false
		var start_time time.Time

		var wg sync.WaitGroup
		wg.Add(1)

		// 开始执行bcc脚本，并向hub返回执行结果
		go func(wg *sync.WaitGroup) {
			defer wg.Done()
			reader := bufio.NewReader(stdout)
			for {
				readString, err := reader.ReadString('\n')
				if err != nil || err == io.EOF {
					fmt.Println("执行结束")
					delete(exist_ebpf_session, scriptName)
					if send_error(END) {
						s.Exit(1)
					} else {
						s.Exit(0)
					}
					return
				}

				// 结束倒计时
				if !start_send && timeoutDuration > 0 {
					start_send = true
					start_time = time.Now()
					go func() {
						time.Sleep(timeoutDuration)
						// 调用cancel后，下一次ReadString就会收到io.EOF的错误
						cancel()
					}()
				}

				exist_ebpf_session[scriptName].remain_time = time.Until(start_time.Add(timeoutDuration))
				fmt.Print(readString)
				if send_error(readString) {
					s.Exit(1)
					return
				}
			}
		}(&wg)
		c.Start()
		wg.Wait()
	} else if len(commands) == 3 && commands[0] == "stop_ebpf_session" {
		// 下面是stop_ebpf_session功能，暂停某个bcc脚本的执行
		scriptName := fmt.Sprintf("%s.py", commands[1])
		script, exist := exist_ebpf_session[scriptName]
		if exist {
			script.cancel()
			delete(exist_ebpf_session, scriptName)
			s.Write([]byte(fmt.Sprintf("end script: %s\n", scriptName)))
			s.Write([]byte(END))
			s.Exit(0)
			return
		} else {
			s.Write([]byte("script not found\n"))
			s.Write([]byte(END))
			s.Exit(0)
		}
	} else {
		s.Exit(1)
	}
}

const END = "-------io.EOF------"
