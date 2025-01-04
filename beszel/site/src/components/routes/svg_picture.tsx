import React, { useState, useEffect } from 'react';
import { Spin, Image, Button, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
// const socket = io('http://192.168.23.131:12345');

const svgimage = ({ onHide }) => {
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        // const onImageData = (data) => {
        //     const svgData = data;
        //     setImageSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`);
        //     setLoading(false);
        // };
        // socket.on('imageData', onImageData);
        // return () => {
        //     socket.off('imageData', onImageData);
        // };
    }, []);

    return (
        <>
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
                <Col span={24}>
                    {loading && <Spin spinning={true}></Spin>}
                    {imageSrc && <Image
                        width={200}
                        src={imageSrc}
                        alt="示例图片"
                        onLoad={() => { }}
                        onError={(e) => {
                            console.log('图片加载出错', e);
                            setLoading(false);
                        }}
                    />}
                </Col>
            </Row>
        </>
    );
};

export default svgimage;