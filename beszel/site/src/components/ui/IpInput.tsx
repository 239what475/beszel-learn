import { InputNumber, Input } from 'antd';
import React, { useState } from'react';
import '../../index_ip.css';

interface PriceInputProps {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
}

const PriceInput : React.FC<PriceInputProps> = ({
    value = '0.0.0.0',
    //无视错误
    onChange,
    disabled = false,
}) => {
    const [numberArr, setNumberArr] = useState<string[]>(value?.split('.') || []);

    const triggerChange = (changedValue: string) => {
        onChange?.(changedValue);
    };

    const onNumberChange = (evalue: string|null, type: number) => {
        const copy = [...numberArr];
        copy[type] = evalue === null? "" : evalue; //判断空
        setNumberArr(copy);
        triggerChange(copy.join('.'));
    };
    return (
        <Input.Group compact className={`${!disabled? 'inputGroup' : 'inputGroup_disable'}`}>
            <InputNumber
                style={{ width: '24%' }}
                disabled={disabled}
                controls={false}
                value={numberArr[0]}
                className="self_input"
                onChange={(e) => onNumberChange(e, 0)}
                min="0"
                max="255"
            />
            <span className="dot" />
            <InputNumber
                type="number"
                style={{ width: '24%' }}
                disabled={disabled}
                controls={false}
                value={numberArr[1]}
                className="self_input"
                onChange={(e) => onNumberChange(e, 1)}
                min="0"
                max="255"
            />
            <span className="dot" />
            <InputNumber
                type="number"
                style={{ width: '24%' }}
                disabled={disabled}
                controls={false}
                value={numberArr[2]}
                className="self_input"
                onChange={(e) => onNumberChange(e, 2)}
                min="0"
                max="255"
            />
            <span className="dot" />
            <InputNumber
                type="number"
                style={{ width: '24%' }}
                disabled={disabled}
                controls={false}
                value={numberArr[3]}
                className="self_input"
                onChange={(e) => onNumberChange(e, 3)}
                min="0"
                max="255"
            />
        </Input.Group>
    );
};

export default PriceInput;