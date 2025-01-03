import React, { useState } from'react';
import { Button, Modal } from 'antd';
import Controldialog from './control_dialog.tsx';
import Svgimage from './svg_picture.tsx';
import Messagetable from './message_table.tsx';
import Servermonitor from './server_monitor.tsx';
import Systemmonitor from './system_monitor.tsx';
import Networkmonitor from './network_monitor.tsx';

const Controlpage = ({ systemIP }) => {
    console.log(systemIP)
    const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
    const [components, setComponents] = useState({
        Controldialog: true,
        Svgimage: false,
        Messagetable: false,
        Servermonitor: false,
        Systemmonitor: false,
        Networkmonitor: false
    });

    const handleBaseOrderChange = (baseOrder) => {
        const newComponents = {...components };
        if (baseOrder ==='socket_block') {
            newComponents.Svgimage = true;
        } else if (baseOrder ==='ssh_monitor') {
            newComponents.Messagetable = true;
        } else if (baseOrder === 'opensnoop') {
            newComponents.Servermonitor = true;
        }
        setComponents(newComponents);
    };

    const handleHideSvgimage = () => {
        const newComponents = {...components };
        newComponents.Svgimage = false;
        setComponents(newComponents);
    };

    const handleHideMessagetable = () => {
        const newComponents = {...components };
        newComponents.Messagetable = false;
        setComponents(newComponents);
    };

    const handleHideNetworkmonitor = () => {
        const newComponents = {...components };
        newComponents.Networkmonitor = false;
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
                                    {componentName === "Controldialog" && <Controldialog onBaseOrderChange={handleBaseOrderChange} systemIP={systemIP} />}
                                    {componentName === "Svgimage" && <Svgimage onHide={handleHideSvgimage}/>}
                                    {componentName === "Messagetable" && <Messagetable onHide={handleHideMessagetable}/>}
                                    {componentName === "Servermonitor" && <Servermonitor onHide={handleHideServermonitor}/>}
                                    {componentName === "Systemmonitor" && <Systemmonitor onHide={handleHideSystemmonitor}/>}
                                    {componentName === "Networkmonitor" && <Networkmonitor onHide={handleHideNetworkmonitor} />}
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