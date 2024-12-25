import React, { useState, useEffect } from'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from'recharts';
import io from'socket.io-client';
//这里的引用不确定...
import { navigate } from './router';


const socket = io('http://localhost:3000');

const ChartPage: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [chartData, setChartData] = useState<number[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSubmit = () => {
        socket.emit('message', { text: inputValue });
        setInputValue('');
    };

    useEffect(() => {
        socket.on('updateData', (newData: number[]) => {
            setChartData(newData);
        });
        return () => {
            socket.off('updateData');
        };
    }, []);

    // 模拟定时更新折线图数据
    useEffect(() => {
        const intervalId = setInterval(() => {
            // 实际应替换为从后端获取真实数据的逻辑
            const newData = Array.from({ length: 5 }, (_, i) => Math.floor(Math.random() * 100));
            socket.emit('requestData', newData);
        }, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div style={{ display: 'flex' }}>
            <div>
                <input type="text" value={inputValue} onChange={handleInputChange} />
                <button onClick={handleSubmit}>提交</button>
            </div>
            <div style={{ width: '500px', height: '400px' }}>
                <LineChart width={500} height={400} data={chartData.map((_, i) => ({ index: i, value: _ }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
            </div>
        </div>
    );
};

export default ChartPage;