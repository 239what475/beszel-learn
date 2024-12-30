import { InputNumber, Input } from 'antd';
import React, { useState } from 'react';
import styles from '../..index_ip.less';

interface PriceInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value = '0.0.0.0',
  onChange,
  disabled = false,
}) => {
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
  return (
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
  );
};

export default PriceInput;

