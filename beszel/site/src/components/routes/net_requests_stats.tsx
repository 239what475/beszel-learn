import React, { useEffect, useState } from 'react';
import { Col, Row, Table } from 'antd';

const columns = [
    {
        title: '指标',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '数值',
        dataIndex: 'value',
        key: 'value',
    },
];

const data = [
    {
        name: '当前活跃连接数',
        value: 0,
    },
    {
        name: '每秒请求数',
        value: 0,
    },
    {
        name: '每秒字节数',
        value: 0,
    },
];

const net_requests_stats = () => {
    const [tableData, setTableData] = useState(data);

    useEffect(() => {
        fetch('http://localhost:8000/api/net_requests/stats')
            .then(response => response.json())
            .then(json => {
                const newData = [
                    { name: '当前活跃连接数', value: json.current_active_connections },
                    { name: '每秒请求数', value: json.requests_per_second },
                    { name: '每秒字节数', value: json.bytes_per_second },
                ];
                setTableData(newData);
            });
    }, []);

    return (
        <>
            <Row><Col span={24} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center' }}>net_requests_stats</Col></Row>
            <Table columns={columns} dataSource={tableData} />
        </>

    );
};

export default net_requests_stats;