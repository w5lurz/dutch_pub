import React from 'react';
import { calculateColorClasses } from './utilFunctions';

type ButtonProps = {
    label?: string;
    color?: string;
    disabled?: boolean;
    handleOnClick: Function;
};

export default function Button({ label, color = 'green', disabled = false, handleOnClick }: ButtonProps) {
    return (
        <button
            className={'p-0.5 px-2 rounded-md border-2 dark:border' + calculateColorClasses(color, disabled)}
            onClick={() => handleOnClick()}
        >
            {label ? label : ''}
        </button>
    );
}
