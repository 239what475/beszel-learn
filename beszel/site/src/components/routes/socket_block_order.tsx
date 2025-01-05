import React, { useEffect, useState } from'react';
import { Button, Col, Row, Space, Table, notification } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

// 定义表格列名
interface TableItem {
    Comm: string;
    PID: string;
    CPU: string;
    TS: string;
    Msg: string;
}

const socketblockmonitor = ({ onHide, socket_block_data }) => {
    const [data, setData] = useState<TableItem[]>([]);
    const [tempData, setTempData] = useState<TableItem[]>([]);
    //用于消息框
    const [api, contextHolder] = notification.useNotification();

    // 解析消息并返回TableItem对象
    const parseMessage = (message) => {
        try {
            const parts = message.split(', ');
            return {
                Comm: parts[0].split(': ')[1],
                PID: parts[1].split(': ')[1],
                CPU: parts[2].split(': ')[1],
                TS: parts[3].split(': ')[1],
                Msg: parts[4],
            };
        } catch (error) {
            api.error({
                message: '解析消息失败',
                description: `Failed to parse message: ${(error as Error).message}`
            });
            return null;
        }
    };

    // 处理新数据
    useEffect(() => {
        if (socket_block_data) {
            const parsed = parseMessage(socket_block_data);
            if (parsed) {
                setTempData([...tempData, parsed]);
            }
        }

        const timeoutId = setTimeout(() => {
            setData(prevData => [...prevData,...tempData]);
            setTempData([]);
        }, 100);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [socket_block_data]);

    // 定义表格列
    const columns = [
        {
            title: 'Comm',
            dataIndex: 'Comm',
            key: 'Comm',
        },
        {
            title: 'PID',
            dataIndex: 'PID',
            key: 'PID',
        },
        {
            title: 'CPU',
            dataIndex: 'CPU',
            key: 'CPU',
        },
        {
            title: 'TS',
            dataIndex: 'TS',
            key: 'TS',
            width: '20%',
        },
        {
            title: 'Msg',
            dataIndex: 'Msg',
            key: 'Msg',
            width: '30%',
        },
    ];

    return (
        <>
            <Row>
                <Col span={22} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center'}}>socket_block_order</Col>
                <Col span={2}>
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onHide}
                    ></Button>
                </Col>
            </Row>
            <Table columns={columns} dataSource={data} />
            {contextHolder}
        </>
    );
};

export default socketblockmonitor;