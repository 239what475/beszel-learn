import { Button, Col, Row } from 'antd';
import React, { useState, useEffect } from'react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Tooltip
} from'recharts';
import { CloseOutlined } from '@ant-design/icons';

const ServerMonitor = ({ onHide }) => {
    const [responseTimes, setResponseTimes] = useState<{ index: number; value: number }[]>([]);
    const [requestsPerSecond, setRequestsPerSecond] = useState<{ index: number; value: number }[]>([]);
    const [concurrentConnections, setConcurrentConnections] = useState<{ newConn: number[], activeConn: number[], idleConn: number[] }>({
        newConn: [],
        activeConn: [],
        idleConn: []
    });
    let index = 0;

    const fetchData = () => {
        index += 1;
        const newResponseTime = Math.floor(Math.random() * 500);
        setResponseTimes(prevResponseTimes => {
            const newData = [...prevResponseTimes, { index, value: newResponseTime }];
            return newData.length > 10? newData.slice(-10) : newData;
        });
        const newRequestPerSecond = Math.floor(Math.random() * 20);
        setRequestsPerSecond(prevRequestsPerSecond => {
            const newData = [...prevRequestsPerSecond, { index, value: newRequestPerSecond }];
            return newData.length > 10? newData.slice(-10) : newData;
        });
        const newNewConn = Math.floor(Math.random() * 10);
        const newActiveConn = Math.floor(Math.random() * 30);
        const newIdleConn = Math.floor(Math.random() * 20);
        setConcurrentConnections(prevConcurrentConnections => ({
            newConn: [
             ...prevConcurrentConnections.newConn,
                newNewConn
            ].slice(-10),
            activeConn: [
             ...prevConcurrentConnections.activeConn,
                newActiveConn
            ].slice(-10),
            idleConn: [
             ...prevConcurrentConnections.idleConn,
                newIdleConn
            ].slice(-10)
        }));
    };

    useEffect(() => {
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // useEffect(() => {
    //     console.log('responseTimes:', responseTimes);
    //     console.log('requestsPerSecond:', requestsPerSecond);
    // }, [responseTimes, requestsPerSecond]);

    return (
        <div>
            <Row>
                <Col span={22}></Col>
                <Col span={2}>
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onHide}
                    ></Button>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ fontSize: '24px', textAlign: 'center', lineHeight: '24px' }}>
                    服务器监控
                </Col>
            </Row>
            <Row>
                <Col span={8} style={{ textAlign: 'center' }}>
                    统计请求响应时间
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                    每秒请求次数
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                    并发连接数监控
                </Col>
            </Row>
            <div style={{ height: '300px', width: '850px', display: 'flex' }}>
                <ResponsiveContainer width="33%" height={275}>
                    <LineChart data={responseTimes}>
                        <Line type="monotone" dataKey="value" stroke="#ff7f0e" />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="33%" height={275}>
                    <AreaChart data={requestsPerSecond}>
                        <Area type="monotone" dataKey="value" stroke="#1f77b4" fill="#1f77b4" opacity={0.3} />
                        <Tooltip />
                    </AreaChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="33%" height={275}>
                    <BarChart data={concurrentConnections.newConn.map((newConn, index) => ({
                        x: index,
                        newConn,
                        activeConn: concurrentConnections.activeConn[index],
                        idleConn: concurrentConnections.idleConn[index]
                    }))}>
                        <Bar dataKey="newConn" stackId="a" fill="#2ca02c" />
                        <Bar dataKey="activeConn" stackId="a" fill="#d62728" />
                        <Bar dataKey="idleConn" stackId="a" fill="#9467bd" />
                        <Tooltip />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ServerMonitor;