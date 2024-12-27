import React, { useState, useEffect } from'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from'recharts';
import io from'socket.io-client';
import './styles.css'; // 用于添加自定义样式

const socket = io('http://localhost:3000');

const ChartPage = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const [chartData, setChartData] = useState<number[]>([10, 20, 30, 40, 50]); // 添加模拟数据

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

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(false); // 切换页面时关闭当前页面
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, setOpen]);

    if (!open) {
        return null;
    }

    return (
        <div className="chart-page-container">
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