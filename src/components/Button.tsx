import React from 'react';
import { Icon } from './Icon.js';

/** Button component with optional icon. */
interface IButtonProps {
    /** Button label text. */
    label: string;

    /** Solar icon name. */
    icon?: string;

    /** Click handler. */
    onClick: () => void;

    /** Button type. */
    type?: 'button' | 'submit' | 'reset';

    /** Whether button is disabled. */
    isDisabled?: boolean;

    /** Optional CSS class overrides. */
    className?: string;
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
            className={`flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {icon && <Icon icon={icon} size={20} className="mr-2" />}
            {label}
        </button>
    );
}
