package ebpf

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"time"

	"github.com/gorilla/websocket"
)

// 对于cpu_profile来说，展示结果是没有意义的，人根本看不懂
// 这里选择的是通过FlameGraph绘制成火焰图
func cpu_profiler_callback(c Command, conn *websocket.Conn) (Callback, error) {
	flameGraph := os.Getenv("FLAME_GRAPH")
	if flameGraph == "" {
		fmt.Println("FLAME_GRAPH not set, please set it to the path of flamegraph.pl")
		return Callback{}, fmt.Errorf("FLAME_GRAPH not set")
	}

	startTime := time.Now().Format("20060102150405")

	tempFile, err := os.CreateTemp("", fmt.Sprintf("%s_cpu_profiler.tmp", startTime))
	if err != nil {
		fmt.Println("Error creating temporary file:", err)
		return Callback{}, err
	}

	// 设置回调函数
	callback := Callback{
		process: func(data string) {
			tempFile.WriteString(data + "\n")
		},
		end: func() {
			tempFile.Close()
			fullCommand := flameGraph + "/flamegraph.pl --hash -bgcolor=blue --title=\"profile Flame Graph\""

			output_file := fmt.Sprintf("%s_cpu_profiler.svg", startTime)

			fullCommand = fmt.Sprintf("%s < %s > %s", fullCommand, tempFile.Name(), output_file)

			println(fullCommand)

			err = exec.Command("bash", "-c", fullCommand).Run()
			if err != nil {
				msg := fmt.Sprintf("FlameGraph error : %s", err)
				fmt.Println(msg)
				conn.WriteMessage(websocket.CloseMessage, []byte(msg))
				return
			}

			svgFile, err := os.Open(output_file)
			if err != nil {
				msg := fmt.Sprintf("open svg error : %s", err)
				fmt.Println(msg)
				conn.WriteMessage(websocket.CloseMessage, []byte(msg))
				return
			}
			defer svgFile.Close()

			svgBytes, err := io.ReadAll(svgFile)
			if err != nil {
				msg := fmt.Sprintf("read svg data error : %s", err)
				fmt.Println(msg)
				conn.WriteMessage(websocket.CloseMessage, []byte(msg))
				return
			}

			conn.WriteMessage(websocket.BinaryMessage, svgBytes)

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

	return callback, nil
}
