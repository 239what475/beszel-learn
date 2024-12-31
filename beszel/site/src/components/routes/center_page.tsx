import React, { useState } from'react';
import { Button, Modal } from 'antd';
import Controldialog from './control_dialog.tsx';
import Svgimage from './svg_picture.tsx';
import Messagetable from './message_table.tsx';
import ComponentD from './ComponentD.tsx';
import ComponentE from './ComponentE.tsx';
import ComponentF from './ComponentF.tsx';

export default function MainApp() {
    const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
    const [components, setComponents] = useState({
        Controldialog: true,
        Svgimage: true,
        Messagetable: true,
        ComponentD: false,
        ComponentE: true,
        ComponentF: false
    });

    const handleBaseOrderChange = (baseOrder) => {
        const newComponents = {...components };
        if (baseOrder ==='socket_block') {
            newComponents.Svgimage = true;
        } else if (baseOrder ==='ssh_monitor') {
            newComponents.Messagetable = true;
        } else if (baseOrder === 'opensnoop') {
            newComponents.ComponentD = true;
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
                width={1500}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(components).map(([componentName, flag], index) => {
                        if (flag) {
                            return (
                                <div
                                    key={index}
                                    style={{ width: 'calc(50% - 5px)' }}
                                >
                                    {componentName === "Controldialog" && <Controldialog onBaseOrderChange={handleBaseOrderChange} />}
                                    {componentName === "Svgimage" && <Svgimage onHide={handleHideSvgimage}/>}
                                    {componentName === "Messagetable" && <Messagetable onHide={handleHideMessagetable}/>}
                                    {componentName === "ComponentD" && <ComponentD />}
                                    {componentName === "ComponentE" && <ComponentE />}
                                    {componentName === "ComponentF" && <ComponentF />}
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