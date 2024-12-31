import React, { useEffect, useState } from'react';
import { Space, Table, notification } from 'antd';
import io from'socket.io-client';

// 定义表格列名
interface TableItem {
    name: string;
    age: string;
    address: string;
}

const columns = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name'
    },
    {
        title: 'Age',
        dataIndex: 'age',
        key: 'age'
    },
    {
        title: 'Address',
        dataIndex: 'address',
        key: 'address'
    }
];

const App: React.FC = () => {
    const [data, setData] = useState<TableItem[]>([]);
    const [api, contextHolder] = notification.useNotification();
    const socket = io('http://192.168.23.131:45876');

    useEffect(() => {
        socket.on('newData', (rawData) => {
            const newItem: TableItem = {
                name: "",
                age: "",
                address: ""
            };
            if (rawData.includes('block')) {
                api.info({
                    message: "Block detected",
                    description: "The received data contains 'block'.",
                    placement: "bottomRight"
                });
            }
            const splitData = rawData.split(' ');
            newItem.name = splitData[0];
            newItem.age = splitData[1];
            newItem.address = splitData.slice(2).join(' ');
            setData((prevData) => [...prevData, newItem]);
        });

        return () => {
            socket.off('newData');
        };
    }, []);

    return (
        <Table columns={columns} dataSource={data} />
    );
};

export default App;