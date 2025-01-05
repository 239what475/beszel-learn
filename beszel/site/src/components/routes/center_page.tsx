import React, { useState } from'react';
import { Button, Modal } from 'antd';
import Controldialog from './control_dialog.tsx';
import Svgimage from './svg_picture.tsx';
import Opensnoopmonitor from './opensnoop_order.tsx';
import Servermonitor from './server_monitor.tsx';
import Systemmonitor from './system_monitor.tsx';
import Socketblockmonitor from './socket_block_order.tsx';
import Sshmonitor from './ssh_monitor.tsx';

const Controlpage = ({ systemIP }) => {
    const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
    const [components, setComponents] = useState({
        Controldialog: true,
        Svgimage: false,
        Opensnoopmonitor: false,
        Servermonitor: false,
        Systemmonitor: false,
        Socketblockmonitor: false,
        Sshmonitor: false
    });
    const [socket_block_responses, setSocket_Block_Responses] = useState(''); //socket_block
    const [ssh_monitor_responses, setSsh_Monitor_Responses] = useState(''); //ssh_monitor
    //下述缺乏数据特征
    //const [opensnoop_responses, setOpensnoop_Responses] = useState(String);
    const uploadResponse = (response) => {
        //对命令进行分类
        //socket_block type
        console.log("中心页面接收到："+ response)
        if(response.startsWith('Comm')){
            setSocket_Block_Responses(response)
        }else if (response.startsWith('register')){
            setSsh_Monitor_Responses(response)
        }
    }

    const handleBaseOrderChange = (baseOrder) => {
        const newComponents = {...components };
        if (baseOrder ==='socket_block') {
            newComponents.Socketblockmonitor = true;
        } else if (baseOrder ==='ssh_monitor') {
            newComponents.Sshmonitor = true;
        } else if (baseOrder === 'opensnoop') {
            newComponents.Opensnoopmonitor = true;
        }
        setComponents(newComponents);
    };

    const handleHideSvgimage = () => {
        const newComponents = {...components };
        newComponents.Svgimage = false;
        setComponents(newComponents);
    };

    const handleHideOpensnoopmonitor = () => {
        const newComponents = {...components };
        newComponents.Opensnoopmonitor = false;
        setComponents(newComponents);
    };

    const handleHideSocketblockmonitor = () => {
        const newComponents = {...components };
        newComponents.Socketblockmonitor = false;
        setComponents(newComponents);
    };

    const handleHideServermonitor = () => {
        const newComponents = {...components };
        newComponents.Servermonitor = false;
        setComponents(newComponents);
    };

    const handleHideSystemmonitor = () => {
        const newComponents = {...components };
        newComponents.Systemmonitor = false;
        setComponents(newComponents);
    };
    const handleHideSshmonitor = () => {
        const newComponents = {...components };
        newComponents.Sshmonitor = false;
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
                                    {componentName === "Svgimage" && <Svgimage onHide={handleHideSvgimage}/>}
                                    {componentName === "Opensnoopmonitor" && <Opensnoopmonitor onHide={handleHideOpensnoopmonitor}/>}
                                    {componentName === "Servermonitor" && <Servermonitor onHide={handleHideServermonitor}/>}
                                    {componentName === "Systemmonitor" && <Systemmonitor onHide={handleHideSystemmonitor}/>}
                                    {componentName === "Socketblockmonitor" && <Socketblockmonitor onHide={handleHideSocketblockmonitor} socket_block_data={socket_block_responses}/>}
                                    {componentName === "Sshmonitor" && <Sshmonitor onHide={handleHideSshmonitor} ssh_monitor_data={ssh_monitor_responses}/>}
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