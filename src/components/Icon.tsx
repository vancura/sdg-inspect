import { Icon as IconifyIcon } from '@iconify/react';
import React from 'react';

/** Icon component props. */
interface IIconProps {
    /** The icon name from Solar icon set. */
    icon: string;

    /** The size of the icon in pixels. */
    size?: number;

    /** Additional CSS classes. */
    className?: string;
}

// noinspection FunctionNamingConventionJS
/** Icon component for displaying Solar icons. */
export function Icon({ icon, size = 24, className = '' }: IIconProps): React.ReactElement {
    return <IconifyIcon icon={`solar:${icon}`} width={size} height={size} className={className} />;
}
