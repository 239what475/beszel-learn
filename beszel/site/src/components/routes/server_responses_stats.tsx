import React, { useEffect, useState } from'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from'recharts';

interface ResponseTimeStats {
    time: number;
    average_response_time: number;
    max_response_time: number;
    min_response_time: number;
}

const ServerResponseTimeChart = () => {
    const [responseTimeData, setResponseTimeData] = useState<ResponseTimeStats[]>([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/server_responses/stats')
        .then(response => response.json())
        .then(json => {
                const dataPoint: ResponseTimeStats = {
                    time: new Date().getTime(),
                    average_response_time: json.average_response_time,
                    max_response_time: json.max_response_time,
                    min_response_time: json.min_response_time
                };
                setResponseTimeData([dataPoint]);
            });
    }, []);

    return (
        <LineChart width={600} height={400}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="average_response_time" stroke="#8884d8" />
            <Line type="monotone" dataKey="max_response_time" stroke="#FF0000" />
            <Line type="monotone" dataKey="min_response_time" stroke="#00FF00" />
        </LineChart>
    );
};

export default ServerResponseTimeChart;