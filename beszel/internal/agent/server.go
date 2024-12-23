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
	remain_time time.Duration
	cancel      context.CancelFunc
}

var exist_ebpf_session = map[string]*EbpfSession{}

func (a *Agent) handleSession(s sshServer.Session) {
	commands := s.Command()

	if len(commands) == 0 {
		stats := a.gatherStats()
		if err := json.NewEncoder(s).Encode(stats); err != nil {
			slog.Error("Error encoding stats", "err", err)
			s.Exit(0)
			return
		}
		s.Exit(0)
	} else if len(commands) == 3 && commands[0] == "get_ebpf_data" {
		subcommands := strings.Split(commands[1], ",")
		scriptName := fmt.Sprintf("%s.py", subcommands[0])
		script, exist := exist_ebpf_session[scriptName]
		if exist {
			output := fmt.Sprintf("script already run, remain time: %.2f s\n", script.remain_time.Seconds())
			println(output)
			s.Write([]byte(output))
			s.Write([]byte("-------io.EOF------"))
			s.Exit(0)
			return
		}

		fullCommand := fmt.Sprintf("python -u %s", scriptName)
		if len(subcommands) > 1 {
			params := strings.Join(subcommands[1:], " ")
			fullCommand = fmt.Sprintf("%s %s", fullCommand, params)
		}

		var ctx context.Context
		var cancel context.CancelFunc

		timeout, _ := strconv.Atoi(commands[2])

		ctx, cancel = context.WithCancel(context.Background())

		exist_ebpf_session[scriptName] = &EbpfSession{
			remain_time: time.Duration(timeout) * time.Second,
			cancel:      cancel,
		}

		println("timeout: ", timeout)

		defer cancel()

		// 检查文件是否存在
		if _, err := os.Stat(scriptName); os.IsNotExist(err) {
			fmt.Printf("文件 %s 不存在\n", scriptName)
			s.Write([]byte(fmt.Sprintf("文件 %s 不存在\n", scriptName)))
			s.Exit(1)
			return
		}

		c := exec.CommandContext(ctx, "bash", "-c", fullCommand)
		stdout, err := c.StdoutPipe()
		if err != nil {
			return
		}
		var wg sync.WaitGroup
		wg.Add(1)

		start_send := false
		var start_time time.Time

		timeoutDuration := time.Duration(timeout) * time.Second

		go func(wg *sync.WaitGroup) {
			defer wg.Done()
			reader := bufio.NewReader(stdout)
			for {
				readString, err := reader.ReadString('\n')
				if err != nil || err == io.EOF {
					fmt.Println("执行结束")
					delete(exist_ebpf_session, scriptName)
					s.Write([]byte("-------io.EOF------"))
					return
				}

				if !start_send && timeoutDuration > 0 {
					start_send = true
					start_time = time.Now()
					go func() {
						time.Sleep(timeoutDuration)
						cancel()
					}()
				}

				exist_ebpf_session[scriptName].remain_time = time.Until(start_time.Add(timeoutDuration))
				fmt.Print(readString)
				s.Write([]byte(readString))
			}
		}(&wg)
		c.Start()
		wg.Wait()

		s.Exit(0)
	} else if len(commands) == 3 && commands[0] == "stop_ebpf_session" {
		scriptName := fmt.Sprintf("%s.py", commands[1])
		script, exist := exist_ebpf_session[scriptName]
		if exist {
			script.cancel()
			delete(exist_ebpf_session, scriptName)
			s.Write([]byte(fmt.Sprintf("end script: %s\n", scriptName)))
			s.Write([]byte("-------io.EOF------"))
			s.Exit(0)
			return
		} else {
			s.Write([]byte("script not found\n"))
			s.Write([]byte("-------io.EOF------"))
			s.Exit(0)
		}
	} else {
		s.Exit(1)
	}
}
