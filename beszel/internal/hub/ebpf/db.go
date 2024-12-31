package ebpf

type Status int

const (
	Status_Init Status = iota
	Status_Running
	Status_Finished
	Status_Error
)

type Task struct {
	cmd    Command
	data   []string
	status Status
}

type Machine struct {
	ip    string
	tasks map[string]Task
}

type EbpfMonitorDB struct {
	machines map[string]Machine
}

func NewEbpfMonitorDB() *EbpfMonitorDB {
	return &EbpfMonitorDB{
		machines: make(map[string]Machine),
	}
}

func (s *EbpfMonitorDB) AddMachine(ip string) {
	s.machines[ip] = Machine{
		ip:    ip,
		tasks: make(map[string]Task),
	}
}

// add task with machine ip, if machine not exist, add machine and add task
func (s *EbpfMonitorDB) AddTask(ip string, task Task) {
	if _, ok := s.machines[ip]; !ok {
		s.AddMachine(ip)
	}
	s.machines[ip].tasks[task.cmd.command] = task
}
