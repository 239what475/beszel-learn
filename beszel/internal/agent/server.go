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

func (a *Agent) handleSession(s sshServer.Session) {
	commands := s.Command()

	if len(commands) == 0 {
		stats := a.gatherStats()
		if err := json.NewEncoder(s).Encode(stats); err != nil {
			slog.Error("Error encoding stats", "err", err)
			s.Exit(1)
			return
		}
		s.Exit(0)
	} else if len(commands) == 3 && commands[0] == "get_ebpf_data" {
		var ctx context.Context
		var cancel context.CancelFunc

		timeout, _ := strconv.Atoi(commands[2])

		println("timeout: ", timeout)

		if timeout < 0 {
			ctx, cancel = context.WithCancel(context.Background())
		} else {
			ctx, cancel = context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
		}

		defer cancel()

		scriptName := fmt.Sprintf("%s.py", commands[1])
		fullCommand := fmt.Sprintf("python -u %s", scriptName)

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
		go func(wg *sync.WaitGroup) {
			defer wg.Done()
			reader := bufio.NewReader(stdout)
			for {
				readString, err := reader.ReadString('\n')
				if err != nil || err == io.EOF {
					fmt.Println("执行结束")
					s.Write([]byte("-------io.EOF------"))
					return
				}
				fmt.Print(readString)
				s.Write([]byte(readString))
			}
		}(&wg)
		c.Start()
		wg.Wait()

		s.Exit(0)
	} else {
		s.Exit(1)
	}
}
