import React from 'react';
import { calculateColorClasses } from './utilFunctions';

type ButtonProps = {
    label?: string;
    color?: string;
    handleOnClick: Function;
};

export default function Button({ label, color = 'green', handleOnClick }: ButtonProps) {
    return (
        <button className={'p-0.5 px-2 rounded-md border-2 dark:border' + calculateColorClasses(color)} onClick={() => handleOnClick()}>
            {label ? label : ''}
        </button>
    );
}
