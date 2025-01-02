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
                <h2>服务器监控</h2>
                <Col span={22}></Col>
                <Col span={2}>
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onHide}
                    ></Button>
                </Col>
            </Row>
            <div style={{ height: '600px', width: '600px' }}>
                <h3>统计请求响应时间</h3>
                <ResponsiveContainer width="300" height="300">
                    <LineChart width={300} height={300} data={responseTimes.map((time, index) => ({ x: index, y: time }))}>
                        <Line type="monotone" dataKey="y" stroke="#ff7f0e" />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
                <h3>每秒请求次数</h3>
                <ResponsiveContainer width="300" height="300">
                    <AreaChart width={300} height={300} data={requestsPerSecond.map((req, index) => ({ x: index, y: req }))}>
                        <Area type="monotone" dataKey="y" stroke="#1f77b4" fill="#1f77b4" opacity={0.3} />
                        <Tooltip />
                    </AreaChart>
                </ResponsiveContainer>
                <h3>并发连接数监控</h3>
                <ResponsiveContainer width="300" height="300">
                    <BarChart width={300} height={300} data={concurrentConnections.newConn.map((newConn, index) => ({
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