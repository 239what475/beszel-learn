import React, { useState, useEffect } from 'react';
import { Spin, Button, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Image } from "antd";

const cpumonitor = ({ onHide, cpu_monitor_data }) => {
    const [loading, setLoading] = useState(true);
    const [svgContent, setSvgContent] = useState('');

    useEffect(() => {
        if (cpu_monitor_data) {
            setSvgContent(cpu_monitor_data);
            setLoading(false);
            console.log('连接赋值完成')
        }
    }, [cpu_monitor_data]);

    return (
        <>
            <div style={{ width: '721px', height: '400px' }}>
                <Row>
                    <Col span={22}></Col>
                    <Col span={2}>
                        <Button icon={<CloseOutlined />} onClick={onHide}></Button>
                    </Col>
                </Row>
                <Row>
                    <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {loading && <Spin />}
                        {svgContent && <Image src={svgContent} />}
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default cpumonitor;
