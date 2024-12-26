首先还是跟着readme来make，具体参考readme

前端我记得就是通过npm安装bun，然后根据readme文档来操作。

后端这边不用配置服务什么的，首先进入beszel/cmd/hub，执行
CGO_ENABLED=0 go build -ldflags "-w -s" .
./hub serve
就能将hub在本地跑起来了，按照https://beszel.dev/zh/guide/getting-started的方式注册后，添加系统，复制publickey，这就是ssh密钥

对于agent，进入beszel/cmd/agent，执行
CGO_ENABLED=0 go build -ldflags "-w -s" .
scp agent 用户名@IP:目录  (将打包的agent文件放在你的虚拟机上，需要支持ebpf，默认的ubuntu就行)
sudo PORT=45876 KEY="ssh密钥" ./agent
然后agent就跑起来了
然后就是记得从这边的仓库里将opensnoop.py和ssh_timeout.py复制到agent所在目录。

然后就可以在hub的命令行中，输入如下的命令：
Enter command (opensnoop,ssh_monitor) and timeout : opensnoop 5
表示执行opensnoop 5秒，理想情况是能看到输出了
Enter command (opensnoop,ssh_monitor) and timeout : ssh_monitor -1
表示一直监控ssh异常登录，后续还得改改，暂时没有退出方式，只能ctrl+c

上面的有些内容过期了，有时间再更新

测试oom： 
stress-ng --cpu 8 --cpu-load 90 --cpu-method ackermann --vm 200 --vm-bytes 30G --vm-hang 20 --timeout 20s

测试cpu_profile：
stress-ng --cpu 8 --cpu-load 50 --vm 2 --vm-bytes 3G --vm-keep --io 4 --hdd 2 --hdd-bytes 1G