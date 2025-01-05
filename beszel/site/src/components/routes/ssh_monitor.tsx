import React, { useEffect, useState } from'react';
import { Button, Col, Row, Space, Table, notification } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
//注：由于其命令生成过慢，不进行延时
// 定义表格列名
interface TableItem {
    Time: string;
    IP: string;
    Port: string;
}

const sshmonitor = ({ onHide, ssh_monitor_data }) => {
    const [data, setData] = useState<TableItem[]>([]);
    //const [tempData, setTempData] = useState<TableItem[]>([]);

    // 解析消息并返回TableItem对象
    const parseMessage = (message) => {
        const timeMatch = message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+[+-]\d{2}:\d{2}/);
        const ipMatch = message.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
        const portMatch = message.match(/port\s+(\d+)/);
        console.log(timeMatch)
        console.log(ipMatch)
        console.log(portMatch)
        if (timeMatch && ipMatch && portMatch) {
            return {
                Time: timeMatch[0],
                IP: ipMatch[0],
                Port: portMatch[1]
            };
        }
        return null;
    };

    // 处理新数据
    useEffect(() => {
        if (ssh_monitor_data) {
            console.log("接受："+ssh_monitor_data)
            const parsed = parseMessage(ssh_monitor_data);
            if (parsed) {
                //setTempData([...tempData, parsed]);
                setData([...data,parsed])
            }
        }
        // const timeoutId = setTimeout(() => {
        //     setData(prevData => [...prevData,...tempData]);
        //     console.log(data)
        //     setTempData([]);
        // }, 100);

        // return () => {
        //     if (timeoutId) {
        //         clearTimeout(timeoutId);
        //     }
        //};
    }, [ssh_monitor_data]);

    // 定义表格列
    const columns = [
        {
            title: 'Time',
            dataIndex: 'Time',
            key: 'Time'
        },
        {
            title: 'IP',
            dataIndex: 'IP',
            key: 'IP'
        },
        {
            title: 'Port',
            dataIndex: 'Port',
            key: 'Port'
        }
    ];

    return (
        <>
            <Row>
                <Col span={22} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center'}}>ssh_monitor_order</Col>
                <Col span={2}>
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onHide}
                    ></Button>
                </Col>
            </Row>
            <Table columns={columns} dataSource={data} />
        </>
    );
};

export default sshmonitor;