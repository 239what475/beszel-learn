import React, { useState, useEffect } from'react';
import { Spin, Image } from 'antd';
import socketIOClient from "socket.io-client";

const socket = socketIOClient('YOUR_SOCKET_SERVER_URL');

const App = () => {
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        const onImageData = (data) => {
            const svgData = data;
            setImageSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`);
            setLoading(false);
        };
        socket.on('imageData', onImageData);
        return () => {
            socket.off('imageData', onImageData);
        };
    }, []);

    return (
        <div>
            {loading && <Spin spinning={true}>正在获取图片...</Spin>}
            {imageSrc && <Image
                width={200}
                src={imageSrc}
                alt="示例图片"
                onLoad={() => {}}
                onError={(e) => {
                    console.log('图片加载出错', e);
                    setLoading(false);
                }}
            />}
        </div>
    );
};

export default App;