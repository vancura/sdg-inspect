import React from 'react';
import { Icon } from './Icon.js';

/** Button component with optional icon. */
interface IButtonProps {
    /** Button label text. */
    readonly label: string;

    /** Solar icon name. */
    readonly icon?: string;

    /** Click handler. */
    readonly onClick: () => void;

    /** Button type. */
    readonly type?: 'button' | 'submit' | 'reset';

    /** Whether button is disabled. */
    readonly isDisabled?: boolean;

    /** Optional CSS class overrides. */
    readonly className?: string;
}

/** Reusable button component with optional Solar icon. */
export function Button({
    label,
    icon,
    onClick,
    type = 'button',
    isDisabled = false,
    className = ''
}: IButtonProps): React.ReactElement {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`flex items-center justify-center rounded-md bg-blue-600 px-3 py-1 text-xs font-light text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {icon && <Icon icon={icon} size={16} className={label ? 'my-1 mr-2' : 'my-1'} />}
            {label}
        </button>
    );
}
