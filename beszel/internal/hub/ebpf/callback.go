package ebpf

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

// 对于cpu_profile来说，展示结果是没有意义的，人根本看不懂
// 这里选择的是通过FlameGraph绘制成火焰图
func cpu_profiler_callback(c Command) (Callback, error) {
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
				fmt.Println(" FlameGraph error : ", err)
				return
			}

			fmt.Println("run ebpf task (", c.generate(), ") success")
		},
		err: func(err error) {
			fmt.Println("run ebpf task (", c.generate(), ") error : ", err)
		},
	}

	return callback, nil
}
