import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { Flex } from 'antd';
import { Select } from 'antd';
import { Form } from 'antd';
import styles from './index.less';

interface PriceInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function controldialog() {
  const value = '0.0.0.0'
  const disabled = false

  const [numberArr, setNumberArr] = useState<string[]>(value?.split('.') || []);

  const triggerChange = (changedValue: string) => {
    onChange?.(changedValue);
  };

  const onNumberChange = (evalue: string, type: number) => {
    const copy = [...numberArr];
    copy[type] = evalue;
    setNumberArr(copy);
    triggerChange(copy.join('.'));
  };

  const [iscontrolModalOpen, setcontrolModalOpen] = useState(false);
  function uploadorder() {
    return
  }
  const uploadflags = false  //控制上传按钮是否禁用
  const onChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  const onSearch = (value: string) => {
    console.log('search:', value);
  };
  const showModal = () => {
    setcontrolModalOpen(true);
  };

  const handlecontrol = () => {
    setcontrolModalOpen(false);
  };

  const handlecontrolCancel = () => {
    setcontrolModalOpen(false);
  };
  return (
    <>
      <Button type="primary" onClick={showModal}>
        命令控制
      </Button>
      <Modal title="命令控制面板" open={iscontrolModalOpen} onOk={handlecontrol} onCancel={handlecontrolCancel} footer={null}>
        <Flex align="start" justify="space-around" >
          <Form
            name="命令控制表单"
            layout="horizontal"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
          >
            <Form.Item label="命令" name="order" rules={[{ required: true }]}>
              <Select
                style={{ width: 300 }}
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
            <Form.Item>
              <Button onClick={() => uploadorder()} disabled={uploadflags}>
                执行命令
              </Button>
            </Form.Item>
            <Form.Item>
              <Input.Group compact className={!disabled ? styles.inputGroup : styles.inputGroup_disable}>
                <InputNumber
                  style={{ width: '24%' }}
                  disabled={disabled}
                  controls={false}
                  value={numberArr[0]}
                  className={styles.self_input}
                  onChange={(e) => onNumberChange(e, 0)}
                  min={'0'}
                  max={'255'}
                />
                <span className={styles.dot} />
                <InputNumber
                  type={'number'}
                  style={{ width: '24%' }}
                  disabled={disabled}
                  controls={false}
                  value={numberArr[1]}
                  className={styles.self_input}
                  onChange={(e) => onNumberChange(e, 1)}
                  min={'0'}
                  max={'255'}
                />
                <span className={styles.dot} />
                <InputNumber
                  type={'number'}
                  style={{ width: '24%' }}
                  disabled={disabled}
                  controls={false}
                  value={numberArr[2]}
                  className={styles.self_input}
                  onChange={(e) => onNumberChange(e, 2)}
                  min={'0'}
                  max={'255'}
                />
                <span className={styles.dot} />
                <InputNumber
                  type={'number'}
                  style={{ width: '24%' }}
                  disabled={disabled}
                  controls={false}
                  value={numberArr[3]}
                  className={styles.self_input}
                  onChange={(e) => onNumberChange(e, 3)}
                  min={'0'}
                  max={'255'}
                />
              </Input.Group>
            </Form.Item>
          </Form>
        </Flex>
      </Modal>
    </>
  );
}