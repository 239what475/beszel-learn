package ebpf

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/pocketbase/pocketbase/core"
	"golang.org/x/crypto/ssh"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// 允许所有来源的连接（在生产环境中应设置为特定的来源）
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ebpf模块入口
func Start_ebpf_monitor(sshClientConfig *ssh.ClientConfig, se *core.ServeEvent) error {
	go func() {
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*") // 同样，*代表允许所有来源
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// 升级HTTP连接为WebSocket连接
			conn, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				fmt.Println("升级HTTP连接出错:", err)
				return
			}
			defer conn.Close()

			handle_ebpf_cmd(sshClientConfig, conn)
		})

		http.ListenAndServe(":12345", nil)
	}()

	return se.Next()
}

// 解析输入的命令
func parse_command(input string) (Command, error) {
	// fmt.Println("command example : get_ebpf_data opensnoop 10 show")
	// fmt.Println("command example : get_ebpf_data socket_block,1.1.1.1 10 show")
	// fmt.Println("command example : get_ebpf_data ssh_monitor -1")
	// fmt.Println("command example : stop_ebpf_session opensnoop")
	// fmt.Println("please input a command:")

	fields := strings.Fields(input)

	fmt.Println("fields:", fields)
	fmt.Println("lens:", len(fields))
	for i, field := range fields {
		fmt.Printf("Field %d: %s\n", i, field)
	}

	if len(fields) != 4 {
		return Command{}, errors.New("invalid input")
	}

	ip := fields[0]
	command := fields[1]
	subcommand := fields[2]
	timeout := fields[3]

	// ip := "192.168.102.2"

	return Command{ip, command, subcommand, timeout}, nil
}

func handle_ebpf_cmd(sshClientConfig *ssh.ClientConfig, conn *websocket.Conn) {
	_, message, err := conn.ReadMessage()
	if err != nil {
		println("read message error: ", err)
		conn.WriteMessage(websocket.CloseMessage, []byte("read message error"))
		return
	}

	c, err := parse_command(string(message))
	if err != nil {
		fmt.Println("Invalid input:", err)
		conn.WriteMessage(websocket.CloseMessage, []byte("parse_command error"))
		return
	}

	var callback Callback

	// 特定指令可能有特定实现
	if strings.HasPrefix(c.subcommand, "cpu_profile") {
		callback, err = cpu_profiler_callback(c, conn)
		if err != nil {
			fmt.Println("Error in cpu_profiler", "err", err)
			conn.WriteMessage(websocket.CloseMessage, []byte("cpu_profiler_callback error"))
			return
		}
	} else {
		// 默认情况
		callback = Callback{
			process: func(data string) {
				fmt.Println("default callback : ", data)
				conn.WriteMessage(websocket.TextMessage, []byte(data))
			},
			end: func() {
				fmt.Println("default callback end")
				msg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "end success")
				conn.WriteMessage(websocket.CloseMessage, msg)
			},
			err: func(err error) {
				msg := fmt.Sprint("run ebpf task (", c.generate(), ") error : ", err)
				fmt.Println(msg)
				conn.WriteMessage(websocket.CloseMessage, []byte(msg))
			},
		}
	}

	// 开始ebpf任务执行
	start_ebpf_task(sshClientConfig, c, callback)
}
