import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip
} from 'recharts';
import { Button, Col, Row } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const SystemMonitor = ({ onHide }) => {
  const [cpuTotalUsage, setCpuTotalUsage] = useState(0);
  const [userKernelRatio, setUserKernelRatio] = useState([0, 0]);
  const [memoryTotalUsage, setMemoryTotalUsage] = useState(0);
  const [memoryTypeRatio, setMemoryTypeRatio] = useState([0, 0, 0]);

  // 模拟获取数据的函数，实际使用时需替换成真实的API调用
  const fetchData = () => {
    // 模拟CPU总使用率
    setCpuTotalUsage(Math.floor(Math.random() * 100));
    // 模拟用户态与内核态比例
    const user = Math.floor(Math.random() * 100);
    const kernel = 100 - user;
    setUserKernelRatio([user, kernel]);
    // 模拟总内存使用情况
    setMemoryTotalUsage(Math.floor(Math.random() * 100));
    // 模拟不同类型内存分配比例
    const type1 = Math.floor(Math.random() * 100);
    const type2 = Math.floor(Math.random() * (100 - type1));
    const type3 = 100 - type1 - type2;
    setMemoryTypeRatio([type1, type2, type3]);
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
      <Col span={24}><h2>CPU 使用情况</h2></Col>
      </Row>
      <div style={{ height: '600px', width: '600px' }}>
        <h3>总使用率</h3>
        <ResponsiveContainer width="300" height="300">
          <PieChart>
            <Pie data={[{ value: cpuTotalUsage }]} dataKey="value" innerRadius="40%" outerRadius="80%" />
          </PieChart>
        </ResponsiveContainer>
        <h3>用户态与内核态的使用比例</h3>
        <ResponsiveContainer width="300" height="300">
          <BarChart width={150} height={40} data={[{ user: userKernelRatio[0], kernel: userKernelRatio[1] }]}>
            <Bar dataKey="user" fill="#4fc3f7" />
            <Bar dataKey="kernel" fill="#e57373" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Row>
      <h2>内存监控</h2>
      </Row>
      <div style={{ height: '600px', width: '600px' }}>
        <h3>总内存使用情况</h3>
        <ResponsiveContainer width="300" height="300">
          <PieChart width={300} height={300}>
            <Pie data={[{ value: memoryTotalUsage }]} dataKey="value" innerRadius="40%" outerRadius="80%" />
          </PieChart>
        </ResponsiveContainer>
        <h3>不同类型的内存分配统计</h3>
        <ResponsiveContainer width="300" height="300">
          <PieChart width={300} height={300}>
            <Pie data={memoryTypeRatio.map((value, index) => ({ value, name: `Type${index + 1}` }))} dataKey="value" />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemMonitor;