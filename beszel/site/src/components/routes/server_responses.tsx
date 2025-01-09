import React, { useEffect, useState } from'react';
import { Col, Row, Table } from 'antd';

const net_server_responses = () => {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/server_responses')
          .then(response => response.json())
          .then(json => {
                const newData = json.response_times.map((time, index) => ({
                    id: index,
                    response_time: time
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
            title: '响应时间 (ms)',
            dataIndex: 'response_time',
            key:'response_time'
        }
    ];

    return (
        <>
            <Row><Col span={24} style={{ fontSize: '24px', lineHeight: '24px', textAlign: 'center' }}>Server Response Times</Col></Row>
            <Table columns={columns} dataSource={tableData} />
        </>
    );
};

export default net_server_responses;