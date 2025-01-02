import React, { useState, useEffect } from'react';
import { Button } from 'antd';
import { Select } from 'antd';
import { Form } from 'antd';
import { Input } from 'antd';
import PriceInput from '../ui/IpInput';
import io from'socket.io-client';

const socket = io('http://192.168.23.131:45876');

export default function controldialog({ onBaseOrderChange }) {
    const [form] = Form.useForm();
    const [shouldShowsocket_blockorder, setshouldShowsocket_blockorder] = useState(false);
    const [shouldShowSecondsForMonitorAndSnoop, setShouldShowSecondsForMonitorAndSnoop] = useState(false);
    const [serverResponse, setServerResponse] = useState('');

    function uploadorder() {
        const baseorder = form.getFieldValue('baseorder');
        if (onBaseOrderChange) {
            onBaseOrderChange(baseorder);
        }
        let command;
        if (baseorder === 'socket_block') {
            const ip = form.getFieldValue('IPaddr');
            const seconds = form.getFieldValue('seconds');
            command = `get_ebpf_data socket_block,${ip} ${seconds} show`;
        } else if (baseorder === 'ssh_monitor') {
            const seconds = form.getFieldValue('seconds');
            command = `get_ebpf_data ssh_monitor ${seconds}`;
        } else if (baseorder === 'opensnoop') {
            const seconds = form.getFieldValue('seconds');
            command = `get_ebpf_data opensnoop ${seconds} show`;
        } else if (baseorder === 'stop_ebpf_session opensnoop') {
            command = `stop_ebpf_session opensnoop`;
        }

        socket.emit('command', command);
    }

    useEffect(() => {
        socket.on('response', (response) => {
            console.log('Server response:', response);
            setServerResponse(response);
        });
        return () => {
            socket.off('response');
        };
    }, []);

    const uploadflags = false;

    const onChange = (value) => {
        console.log(`selected ${value}`);
        setshouldShowsocket_blockorder(value === 'socket_block');
        setShouldShowSecondsForMonitorAndSnoop(value === 'ssh_monitor' || value === 'opensnoop');
    };

    const onSearch = (value) => {
        console.log('search:', value);
    };

    useEffect(() => {
        // 当状态变化时，会触发重新渲染
    }, [shouldShowsocket_blockorder, shouldShowSecondsForMonitorAndSnoop]);

    return (
        <>
            <Form
                form={form}
                initialValues={{
                    ip: '',
                    time: '',
                }}
                onFinish={uploadorder}
                name="命令控制表单"
                layout="horizontal"
            >
                <Form.Item label="命令" name="baseorder" rules={[{ required: true }]} style={{ display: 'inline-block', width: '60%' }}>
                    <Select
                        showSearch
                        placeholder="请选择一个命令"
                        optionFilterProp="label"
                        onChange={onChange}
                        onSearch={onSearch}
                        options={[
                            {
                                value: 'socket_block',
                                label: 'socket_block',
                            },
                            {
                                value: 'ssh_monitor',
                                label: 'ssh_monitor',
                            },
                            {
                                value: 'opensnoop',
                                label: 'opensnoop',
                            },
                            {
                                value: 'stop_ebpf_session opensnoop',
                                label: 'stop_ebpf_session opensnoop',
                            },
                        ]}
                    />
                </Form.Item>
                <Form.Item style={{ display: 'inline-block', width: '20%', marginLeft: '10%' }}>
                    <Button onClick={() => uploadorder()} disabled={uploadflags}>
                        执行命令
                    </Button>
                </Form.Item>
                {shouldShowsocket_blockorder && (
                    <>
                        <Form.Item layout="horizontal" name="IPaddr" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} label="网络地址：" rules={[{ required: true, message: '请输入IP地址' }]}>
                            <PriceInput />
                        </Form.Item>
                        <Form.Item layout="horizontal" name="seconds" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} label="时间（秒）：" rules={[{ required: true, message: '请输入时间' }]}>
                            <Input prefix="seconds" suffix="秒" type="number" />
                        </Form.Item>
                    </>
                )}
                {shouldShowSecondsForMonitorAndSnoop && (
                    <>
                        <Form.Item layout="horizontal" name="seconds" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} label="时间（秒）：" rules={[{ required: true, message: '请输入时间' }]}>
                            <Input prefix="seconds" suffix="秒" type="number" />
                        </Form.Item>
                    </>
                )}
                {serverResponse && <p>{serverResponse}</p>}
            </Form>
        </>
    );
}