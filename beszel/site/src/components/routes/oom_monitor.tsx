import React, { useEffect, useState } from 'react';
import { Button, Col, Row, Space, Table, notification } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

// 定义表格列名
interface TableItem {
    time: string;
    triggeredByPID: string;
    oomKillOfPID: string;
    pages: string;
}

const oommonitor = ({ onHide, oom_monitor_data }) => {
    const [data, setData] = useState<TableItem[]>([]);
    //用于消息框
    const [api, contextHolder] = notification.useNotification();

    // 解析消息并返回TableItem对象
    const parseMessage = (message) => {
        try {
            // 匹配时间
            const timeMatch = message.match(/^\d{2}:\d{2}:\d{2}/);
            console.log(timeMatch);
            const time = timeMatch ? timeMatch[0] : null;

            // 匹配Triggered by PID
            const triggeredByPIDMatch = message.match(/Triggered by PID (\d+)\s\("([^"]+)"\)/);
            console.log(triggeredByPIDMatch);
            const triggeredByPID = triggeredByPIDMatch ? triggeredByPIDMatch[1] + " " + triggeredByPIDMatch[2] : null;

            // 匹配OOM kill of PID
            const oomKillOfPIDMatch = message.match(/OOM kill of PID (\d+)\s\("([^"]+)"\)/);
            console.log(oomKillOfPIDMatch);
            const oomKillOfPID = oomKillOfPIDMatch ? oomKillOfPIDMatch[1] + " " + oomKillOfPIDMatch[2] : null;

            // 匹配pages
            const pagesMatch = message.match(/(\d+)\s+pages$/);
            console.log(pagesMatch);
            const pages = pagesMatch ? pagesMatch[1] : null;

            if (time && triggeredByPID && oomKillOfPID && pages) {
                return {
                    time,
                    triggeredByPID,
                    oomKillOfPID,
                    pages
                };
            }
            return null;
        } catch (error) {
            api.error({
                message: '解析消息失败',
                description: `Failed to parse message: ${(error as Error).message}`
            });
            return null;
        }
    };

    useEffect(() => {
        if (oom_monitor_data && oom_monitor_data.length > 0) {
            setData([])
            oom_monitor_data.forEach((response) => {
                const parsed = parseMessage(response);
                if (parsed) {
                    setData(prevData => [...prevData, parsed]);
                }
            });
        }
    }, [oom_monitor_data]);

    // 定义表格列
    const columns = [
        {
            title: '时间',
            dataIndex: 'time',
            key: 'time',
        },
        {
            title: 'Triggered by PID',
            dataIndex: 'triggeredByPID',
            key: 'triggeredByPID',
        },
        {
            title: 'OOM kill of PID',
            dataIndex: 'oomKillOfPID',
            key: 'oomKillOfPID',
        },
        {
            title: 'pages',
            dataIndex: 'pages',
            key: 'pages',
        },
    ];

    return (
        <>
            <Row>
                <Col span={22} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center' }}>oom_monitor</Col>
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

export default oommonitor;