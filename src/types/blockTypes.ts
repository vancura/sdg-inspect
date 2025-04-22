import type { ReactNode } from 'react';

/** Block rendering type (standard div or pre-formatted block). */
export type BlockType = 'standard' | 'pre';

/** Base props for all block components. */
export interface IBlockProps {
    /** The index of the block. */
    index: number;

    /** The block ID. */
    blockId?: string;

    /** Function to call when block is clicked. */
    onBlockClick: (blockId: string) => void;

    /** Block type (standard div or pre). */
    blockType?: BlockType;

    /** Additional CSS classes. */
    className?: string;

    /** Block content. */
    children: ReactNode;
}

/** Props for the JsonBlock component. */
export interface IJsonBlockProps {
    /** The index of the block. */
    index: number;

    /** The ID of the block. */
    id?: string;

    /** The messages of the block. */
    messages: Array<{
        /** The content of the message. */
        content?: string;

        /** The role of the message. */
        role?: string;
    }>;

    /** The metadata of the block. */
    metadata?: string;

    /** Function to call when block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/** Props for the JsonPlainBlock component. */
export interface IJsonPlainBlockProps {
    /** The index of the block. */
    index: number;

    /** The content of the block. */
    content: string;

    /** Function to call when block is clicked. */
    onBlockClick: (blockId: string) => void;
}
