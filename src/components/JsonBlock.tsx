import React, { useCallback, useRef } from 'react';

// Common types and interfaces.
type BlockType = 'standard' | 'pre';

/** Base props for all block components/ */
interface IBlockProps {
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
    children: React.ReactNode;
}

/** Props for the JsonBlock component. */
interface IJsonBlockProps {
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
interface IJsonPlainBlockProps {
    /** The index of the block. */
    index: number;

    /** The content of the block. */
    content: string;

    /** Function to call when block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/** Shared utilities. */

/**
 * Creates a block ID from an index.
 *
 * @param index - The block index
 * @returns The formatted block ID
 */
const getBlockId = (index: number): string => `formatted-line-${index}`;

/**
 * Check if text is currently selected.
 *
 * @returns True if text is selected
 */
const isTextSelected = (): boolean => !!window.getSelection()?.toString();

/**
 * Strips HTML tags from a string.
 *
 * @param html - The string containing HTML to strip
 * @returns The string with HTML tags removed
 */
const stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(?:>|$)/g, '');
};

/**
 * Parses metadata string to object with error handling.
 *
 * @param metadata - Metadata string to parse
 * @returns Parsed metadata object or null on error
 */
const parseMetadata = (metadata?: string): Record<string, any> | null => {
    if (!metadata) return null;

    try {
        return JSON.parse(metadata);
    } catch (e) {
        console.error('Failed to parse metadata:', e);
        return null;
    }
};

/** Block component - handles both standard and pre blocks. */
const Block: React.FC<IBlockProps> = ({
    index,
    blockId: externalBlockId,
    onBlockClick,
    blockType = 'standard',
    className = '',
    children
}) => {
    const blockId = externalBlockId || getBlockId(index);
    const isSelectingRef = useRef(false);

    const handleMouseDown = useCallback(() => {
        isSelectingRef.current = false;
    }, []);

    const handleMouseMove = useCallback(() => {
        if (window.getSelection()?.toString()) {
            isSelectingRef.current = true;
        }
    }, []);

    const handleClick = useCallback(() => {
        if (!isSelectingRef.current && !isTextSelected()) {
            onBlockClick(blockId);
        }
    }, [blockId, onBlockClick, isSelectingRef]);

    // Common props for both block types.
    const commonProps = {
        'data-line-index': index,
        'data-source-line': index + 1,
        id: blockId,
        tabIndex: 0,
        role: 'button',
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onClick: handleClick
    };

    // Render either a div or pre based on blockType.
    return blockType === 'pre' ? (
        <pre
            className={`preview-block-highlight:bg-text-editor-bg/90 mb-4 cursor-pointer bg-text-editor-bg/70 px-4 py-2 text-black ${className}`}
            {...commonProps}
        >
            {children}
        </pre>
    ) : (
        <div className={`cursor-pointer ${className}`} {...commonProps}>
            {children}
        </div>
    );
};

/** Metadata display component. */
const MetadataSection: React.FC<{ metadata: Record<string, any> }> = ({ metadata }) => (
    <div className="mt-3 border-t border-dashed border-secondary-sep pt-3">
        <div className="mb-2 text-sm font-medium">Metadata:</div>

        {Object.entries(metadata).map(([key, value], i) => (
            <div className="mb-2 text-xs" key={i}>
                <span className="mb-0.5 mr-2 inline-block font-medium">{key}:</span>

                <span className="inline-block break-words">
                    {typeof value === 'string'
                        ? key === 'domain'
                            ? stripHtmlTags(value)
                            : value
                        : JSON.stringify(value)}
                </span>
            </div>
        ))}
    </div>
);

// Export the CSS classes for the TextEditor to access.
export const jsonBlockStyles = `
.preview-block-highlight pre {
    background-color: rgba(255, 255, 255, 0.9);
}
`;

// Export SDG styles for TextEditor.
export const sdgStyles = `
.sdg-user-tag {
    color: #005cc5;
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 4px;
    background-color: rgba(0, 92, 197, 0.1);
    display: inline-block;
    margin: 4px 0;
}

.sdg-assistant-tag {
    color: #22863a;
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 4px;
    background-color: rgba(34, 134, 58, 0.1);
    display: inline-block;
    margin: 4px 0;
}

.sdg-question {
    background-color: rgba(0, 92, 197, 0.1);
    border-left: 3px solid #005cc5;
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: 0 4px 4px 0;
    white-space: pre-wrap;
}

.sdg-answer {
    background-color: rgba(34, 134, 58, 0.1);
    border-left: 3px solid #22863a;
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: 0 4px 4px 0;
    white-space: pre-wrap;
}

.sdg-document {
    font-style: italic;
    background-color: rgba(145, 71, 255, 0.1);
    border-left: 2px solid #9147ff;
    padding: 4px 8px;
    margin: 4px 0;
    display: block;
    border-radius: 0 4px 4px 0;
}

.sdg-domain {
    font-weight: bold;
    color: #6f42c1;
    background-color: rgba(111, 66, 193, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
}

.json-scroller {
    overflow-y: auto;
    scroll-behavior: smooth;
    height: 100%;
}
`;

/** JsonBlock component for displaying SDG entries in a formatted block. */
export const JsonBlock: React.FC<IJsonBlockProps> = ({ index, id, messages, metadata, onBlockClick }) => {
    const parsedMetadata = parseMetadata(metadata);

    return (
        <Block index={index} onBlockClick={onBlockClick} className="json-block relative mb-4 font-mono">
            <div className="preview-block-highlight:bg-text-editor-bg border-b border-gray-300 bg-text-editor-bg/80 px-4 py-3 font-sans text-sm font-medium text-black">
                SDG Entry #{index + 1}
            </div>

            <div className="preview-block-highlight:bg-text-editor-bg/90 bg-text-editor-bg/70 p-3 text-black">
                {messages.map((msg, msgIndex) => {
                    if (!msg.content) {
                        return null;
                    }

                    return (
                        <div className="mb-4 mt-2" key={msgIndex}>
                            <div className="mb-1 text-xs text-gray-500">Role: {msg.role ?? 'unknown'}</div>
                            <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                        </div>
                    );
                })}

                {parsedMetadata && <MetadataSection metadata={parsedMetadata} />}

                {id && <div className="mb-1 mt-2 text-xs text-gray-500">ID: {id}</div>}
            </div>
        </Block>
    );
};

/** JsonPlainBlock component for displaying non-SDG entries as preformatted text. */
export const JsonPlainBlock: React.FC<IJsonPlainBlockProps> = ({ index, content, onBlockClick }) => {
    return (
        <Block index={index} onBlockClick={onBlockClick} blockType="pre">
            {content}
        </Block>
    );
};
