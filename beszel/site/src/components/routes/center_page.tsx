import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import Controldialog from './control_dialog.tsx';
import Cpumonitor from './cpu_monitor.tsx';
import Opensnoopmonitor from './opensnoop_order.tsx';
import Servermonitor from './server_monitor.tsx';
import Systemmonitor from './system_monitor.tsx';
import Socketblockmonitor from './socket_block_order.tsx';
import Sshmonitor from './ssh_monitor.tsx';
import Oommonitor from './oom_monitor.tsx';
//import ServerResponseTimeChart from './server_responses_stats.tsx'

const Controlpage = ({ systemIP }) => {
    const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
    const [components, setComponents] = useState({
        Controldialog: true,
        Cpumonitor: false,
        Opensnoopmonitor: false,
        Servermonitor: true,
        Systemmonitor: true,
        Socketblockmonitor: false,
        Sshmonitor: false,
        Oommonitor: false,
        //ServerResponseTimeChart:true
    });
    const [socket_block_responses, setSocket_Block_Responses] = useState(''); //socket_block
    const [ssh_monitor_responses, setSsh_Monitor_Responses] = useState(''); //ssh_monitor
    const [cpu_monitor_responses, setCpu_monitor_Responses] = useState('');
    const [oom_monitor_responses, setOom_monitor_responses] = useState<any[]>([]);

    const uploadResponse = async (response) => {
        //对命令进行分类
        //socket_block type
        console.log("中心页面接收到：" + response);
        if (response instanceof Blob) {
            console.log("处理Blob数据")
            const blob = new Blob([response], { type: 'image/svg+xml' });
            const SVGurl = URL.createObjectURL(blob);
            console.log("输入：" + SVGurl)
            setCpu_monitor_Responses(SVGurl);
        } else if (response.startsWith('Comm')) {
            setSocket_Block_Responses(response);
        } else if (response.startsWith('register')) {
            setSsh_Monitor_Responses(response);
        }else if (response.includes('OOM kill')) {
            setOom_monitor_responses(prevResponses => [...prevResponses, response]);
            console.log('获得OOM结果'+oom_monitor_responses)
        }
    };

    const handleBaseOrderChange = (baseOrder) => {
        const newComponents = { ...components };
        if (baseOrder === 'socket_block') {
            newComponents.Socketblockmonitor = true;
        } else if (baseOrder === 'ssh_monitor') {
            newComponents.Sshmonitor = true;
        } else if (baseOrder === 'opensnoop') {
            newComponents.Opensnoopmonitor = true;
        } else if (baseOrder === 'cpu_profile') {
            newComponents.Cpumonitor = true
        } else if (baseOrder === 'oom_monitor') {
            newComponents.Oommonitor = true
        }
        setComponents(newComponents);
    };

    const handleHideCpumonitor = () => {
        const newComponents = { ...components };
        newComponents.Cpumonitor = false;
        setComponents(newComponents);
    };

    const handleHideOpensnoopmonitor = () => {
        const newComponents = { ...components };
        newComponents.Opensnoopmonitor = false;
        setComponents(newComponents);
    };

    const handleHideSocketblockmonitor = () => {
        const newComponents = { ...components };
        newComponents.Socketblockmonitor = false;
        setComponents(newComponents);
    };

    const handleHideServermonitor = () => {
        const newComponents = { ...components };
        newComponents.Servermonitor = false;
        setComponents(newComponents);
    };

    const handleHideSystemmonitor = () => {
        const newComponents = { ...components };
        newComponents.Systemmonitor = false;
        setComponents(newComponents);
    };
    const handleHideSshmonitor = () => {
        const newComponents = { ...components };
        newComponents.Sshmonitor = false;
        setComponents(newComponents);
    };
    const handleHideOommonitor = () => {
        const newComponents = { ...components };
        newComponents.Oommonitor = false;
        setComponents(newComponents);
    };
    const showModal = () => {
        setcontrolModalOpen(true);
    };

    const handlecontrol = () => {
        setcontrolModalOpen(false);
    };

    const handlecontrolCancel = () => {
        setcontrolModalOpen(false);
    };

    return (
        <>
            <Button type="primary" onClick={showModal}>
                命令控制
            </Button>
            <Modal
                title="命令控制面板"
                open={iscontrolModalOpen}
                onOk={handlecontrol}
                onCancel={handlecontrolCancel}
                footer={null}
                width={1800}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(components).map(([componentName, flag], index) => {
                        if (flag) {
                            return (
                                <div
                                    key={index}
                                    style={{ width: 'calc(50% - 5px)' }}
                                >
                                    {componentName === "Controldialog" && <Controldialog uploadResponse={uploadResponse} onBaseOrderChange={handleBaseOrderChange} systemIP={systemIP} />}
                                    {/* 待添加 */}
                                    {componentName === "Cpumonitor" && <Cpumonitor onHide={handleHideCpumonitor} cpu_monitor_data={cpu_monitor_responses} />}
                                    {componentName === "Opensnoopmonitor" && <Opensnoopmonitor onHide={handleHideOpensnoopmonitor} />}
                                    {componentName === "Servermonitor" && <Servermonitor onHide={handleHideServermonitor} />}
                                    {componentName === "Systemmonitor" && <Systemmonitor onHide={handleHideSystemmonitor} />}
                                    {componentName === "Socketblockmonitor" && <Socketblockmonitor onHide={handleHideSocketblockmonitor} socket_block_data={socket_block_responses} />}
                                    {componentName === "Sshmonitor" && <Sshmonitor onHide={handleHideSshmonitor} ssh_monitor_data={ssh_monitor_responses} />}
                                    {componentName === "Oommonitor" && <Oommonitor onHide={handleHideOommonitor} oom_monitor_data={oom_monitor_responses} />}
                                    {/* {componentName === "ServerResponseTimeChart" && <ServerResponseTimeChart/>} */}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </Modal>
        </>
    );
}

export default Controlpage