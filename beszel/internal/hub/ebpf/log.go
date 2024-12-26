package ebpf

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func create_log_file(c Command) (*os.File, error) {
	// 创建log文件
	startTime := time.Now().Format("20060102150405")

	command := c.generate()

	currentDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get current working directory: %v", err)
	}

	logDir := filepath.Join(currentDir, ".log")

	if err := os.MkdirAll(logDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %v", err)
	}

	command = strings.ReplaceAll(command, " ", "_")
	fileName := filepath.Join(logDir, fmt.Sprintf("%s_%s.log", startTime, command))

	file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening log file", "err", err)
		return nil, err
	}

	return file, nil
}

func write_in_log(logFile *os.File, data string) {
	_, err := logFile.WriteString(data + "\n")
	if err != nil {
		fmt.Println("Error writing to log file", "err", err)
	}
}
