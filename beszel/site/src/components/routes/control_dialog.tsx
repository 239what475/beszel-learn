import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { Select } from 'antd';
import { Form } from 'antd';
import { Input } from 'antd';
import PriceInput from '../ui/IpInput';

export default function controldialog() {
  const [form] = Form.useForm();
  const [shouldShowsocket_blockorder, setshouldShowsocket_blockorder] = useState(false); //

  function uploadorder() {
    return;
  }

  const uploadflags = false;

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setshouldShowsocket_blockorder(value === 'socket_block');
    console.log(form.getFieldValue("IPaddr"))
    console.log(form.getFieldValue("seconds"))
  };

  const onSearch = (value: string) => {
    console.log('search:', value);
  };

  useEffect(() => {
    // 当 shouldShowPriceInput 状态变化时，会触发重新渲染
  }, [shouldShowsocket_blockorder]);

  return (
    <>
      <Form
        form={form}
        initialValues={{
          ip: '',
          time: '',
        }}
        onFinish={uploadorder}
        name="命令控制表单"
        layout="horizontal"
      >
        <Form.Item label="命令" name="baseorder" rules={[{ required: true }]} style={{ display: 'inline-block', width: '60%' }} >
          <Select
            showSearch
            placeholder="请选择一个命令"
            optionFilterProp="label"
            onChange={onChange}
            onSearch={onSearch}
            options={[
              {
                value: 'socket_block',
                label: 'socket_block',
              },
              {
                value: 'ssh_monitor',
                label: 'ssh_monitor',
              },
              {
                value: 'opensnoop',
                label: 'opensnoop',
              },
              {
                value: 'stop_ebpf_session opensnoop',
                label: 'stop_ebpf_session opensnoop',
              },
            ]}
          />
        </Form.Item>
        <Form.Item style={{ display: 'inline-block', width: '20%', marginLeft: '10%' }}>
          <Button onClick={() => uploadorder()} disabled={uploadflags}>
            执行命令
          </Button>
        </Form.Item>
        {shouldShowsocket_blockorder && (
          <>
            <Form.Item layout="horizontal" name="IPaddr" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} label="网络地址：" rules={[{ required: true, message: '请输入IP地址' }]}>
              <PriceInput />
            </Form.Item>
            <Form.Item layout="horizontal" name="seconds" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} label="时间（秒）：" rules={[{ required: true, message: '请输入时间' }]}>
              <Input prefix="seconds" suffix="秒" type="number" />
            </Form.Item>
          </>
        )}
      </Form>
    </>
  );
}