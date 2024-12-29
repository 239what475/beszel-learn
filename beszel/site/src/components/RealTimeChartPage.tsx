import { useState, useEffect } from'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from'recharts';
import io from'socket.io-client';
import { Input } from 'antd';
import { Button, Flex } from 'antd';
import './styles.css';
import React from'react';

const socket = io('http://localhost:3000');

const ChartPage = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const [chartData, setChartData] = useState<number[]>([10, 20, 30, 40, 50]);
    const { TextArea } = Input;
    const textareaRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el2 = textareaRef.current;
        console.log(el2);
    }, []);

    const clearall = () => {
        setInputValue('');
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
                setOpen(false);
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
                <TextArea
                    ref={textareaRef}
                    rows={4}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <Flex gap="small" wrap>
                    <Button onClick={() => handleSubmit()}>提交</Button>
                    <Button onClick={() => clearall()}>清空</Button>
                </Flex>
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