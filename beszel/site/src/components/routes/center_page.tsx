import React, { useState } from'react';
import { Button, Modal } from 'antd';
import Controldialog from './control_dialog.tsx';
import ComponentB from './ComponentB.tsx';
import ComponentC from './ComponentC.tsx';
import ComponentD from './ComponentD.tsx';
import ComponentE from './ComponentE.tsx';
import ComponentF from './ComponentF.tsx';

// 定义组件和对应的显示标志对象
const componentMap = {
    Controldialog: true,
    ComponentB: false,
    ComponentC: true,
    ComponentD: false,
    ComponentE: true,
    ComponentF: false
};

export default function controldialog() {
    const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
    const [components, setComponents] = useState(componentMap);

    const toggleVisibility = (componentName) => {
        const newComponents = {...components };
        newComponents[componentName] =!newComponents[componentName];
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
                width="80%"
                height="80%"
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(components).map(([componentName, flag], index) => {
                        if (flag) {
                            return (
                                <div
                                    key={index}
                                    style={{ width: 'calc(50% - 5px)' }}
                                >
                                    {componentName === "Controldialog" && <Controldialog />}
                                    {componentName === "ComponentB" && <ComponentB />}
                                    {componentName === "ComponentC" && <ComponentC />}
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