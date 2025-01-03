import { Button, Col, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Tooltip
} from 'recharts';
import { CloseOutlined } from '@ant-design/icons';

const ServerMonitor = ({ onHide }) => {
    const [responseTimes, setResponseTimes] = useState<number[]>([]);
    const [requestsPerSecond, setRequestsPerSecond] = useState<number[]>([]);
    const [concurrentConnections, setConcurrentConnections] = useState<{ newConn: number[], activeConn: number[], idleConn: number[] }>({
        newConn: [],
        activeConn: [],
        idleConn: []
    });

    // 模拟获取数据的函数，实际使用时需替换成真实的API调用
    const fetchData = () => {
        // 模拟响应时间数据
        const newResponseTime = Math.floor(Math.random() * 500);
        setResponseTimes([...responseTimes, newResponseTime]);
        // 模拟每秒请求次数数据
        const newRequestPerSecond = Math.floor(Math.random() * 20);
        setRequestsPerSecond([...requestsPerSecond, newRequestPerSecond]);
        // 模拟并发连接数数据
        const newNewConn = Math.floor(Math.random() * 10);
        const newActiveConn = Math.floor(Math.random() * 30);
        const newIdleConn = Math.floor(Math.random() * 20);
        setConcurrentConnections({
            newConn: [...concurrentConnections.newConn, newNewConn],
            activeConn: [...concurrentConnections.activeConn, newActiveConn],
            idleConn: [...concurrentConnections.idleConn, newIdleConn]
        });
    };

    useEffect(() => {
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

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
            <div style={{ height: '300px', width: '850px', display: 'flex'}}>
                <ResponsiveContainer width="33%" height={275}>
                    <LineChart data={responseTimes.map((time, index) => ({ x: index, y: time }))}>
                        <Line type="monotone" dataKey="y" stroke="#ff7f0e" />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="33%" height={275}>
                    <AreaChart data={requestsPerSecond.map((req, index) => ({ x: index, y: req }))}>
                        <Area type="monotone" dataKey="y" stroke="#1f77b4" fill="#1f77b4" opacity={0.3} />
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