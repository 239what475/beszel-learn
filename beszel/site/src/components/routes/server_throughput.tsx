import React, { useEffect, useState } from'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from'recharts';

interface ThroughputDataPoint {
    time: number;
    value: number;
}

const ServerThroughputChart = () => {
    const [throughputData, setThroughputData] = useState<ThroughputDataPoint[]>([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/server_throughput')
         .then(response => response.json())
         .then(json => {
                const dataPoint: ThroughputDataPoint = {
                    time: new Date().getTime(),
                    value: json.throughput
                };
                setThroughputData([dataPoint]);
            });
    }, []);

    return (
        <LineChart width={600} height={400}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
    );
};

export default ServerThroughputChart;