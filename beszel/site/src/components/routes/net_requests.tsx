import React, { useEffect, useState } from'react';
import { Col, Row, Table } from 'antd';

const net_server_responses = () => {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/net_requests')
          .then(response => response.json())
          .then(json => {
                const newData = json.map((item, index) => ({
                    id: index,
                    timestamp: item.timestamp,
                    pid: item.pid,
                    comm: item.comm,
                    bytes: item.bytes,
                    latency_us: item.latency_us
                }));
                setTableData(newData);
            });
    }, []);

    const columns = [
        {
            title: '序号',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: '时间戳',
            dataIndex: 'timestamp',
            key: 'timestamp'
        },
        {
            title: '进程ID',
            dataIndex: 'pid',
            key: 'pid'
        },
        {
            title: '进程名',
            dataIndex: 'comm',
            key: 'comm'
        },
        {
            title: '字节数',
            dataIndex: 'bytes',
            key: 'bytes'
        },
        {
            title: '延迟 (微秒)',
            dataIndex: 'latency_us',
            key: 'latency_us'
        }
    ];

    return (
        <>
            <Row><Col span={24} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center' }}>Net Requests Info</Col></Row>
            <Table columns={columns} dataSource={tableData} />
        </>
    );
};

export default net_server_responses;