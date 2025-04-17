import React, { useRef } from 'react';

/** Styles for JsonBlock and JsonPlainBlock components */
export const jsonBlockStyles = `
    .json-block {
        margin: 0 0 16px;
        position: relative;
        font-family: "IBM Plex Mono", monospace;
        cursor: pointer;
    }

    .json-header {
        background-color: rgba(255, 255, 255, 0.8);
        padding: 11px 16px 12px;
        border-bottom: 1px solid rgba;
        font-family: "IBM Plex Sans", sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: black;
    }

    .preview-block-highlight .json-header {
        background: rgba(255, 255, 255, 1);
    }

    .json-content {
        padding: 12px 16px;
        background-color: rgba(255, 255, 255, 0.7);
        color: black;
    }

    .preview-block-highlight .json-content {
        background: rgba(255, 255, 255, 0.9);
    }

    .json-block, pre {
        cursor: pointer;
    }

    .metadata-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed rgba(0, 0, 0, 0.2);
    }

    .metadata-item {
        margin-bottom: 8px;
    }

    .metadata-key {
        font-weight: 500;
        display: inline-block;
        margin-right: 8px;
        margin-bottom: 1px;
    }

    .metadata-value {
        display: inline-block;
        word-break: break-word;
    }
`;

/** Interface for the JsonBlock component */
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

    /** The function to call when the block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/**
 * Strips HTML tags from a string.
 *
 * @param {string} html - The string containing HTML to strip.
 * @returns {string} The string with HTML tags removed.
 */
const stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(>|$)/g, '');
};

/**
 * JsonBlock component for displaying SDG entries in a formatted block.
 *
 * @param {IJsonBlockProps} props - The props for the JsonBlock component.
 * @returns {React.ReactElement} The JsonBlock component.
 */
export const JsonBlock: React.FC<IJsonBlockProps> = ({ index, id, messages, metadata, onBlockClick }) => {
    const blockId = `formatted-line-${index}`;
    let parsedMetadata: Record<string, any> | null = null;
    const isSelectingRef = useRef(false);

    // Try to parse metadata if it exists
    if (metadata) {
        try {
            parsedMetadata = JSON.parse(metadata);
        } catch (e) {
            console.error('Failed to parse metadata:', e);
        }
    }

    // Handle mouse down to detect potential text selection
    const handleMouseDown = () => {
        isSelectingRef.current = false;
    };

    // Handle mouse move to detect if user is dragging (selecting text)
    const handleMouseMove = () => {
        if (window.getSelection()?.toString()) {
            isSelectingRef.current = true;
        }
    };

    // Handle click only if not selecting text
    const handleClick = () => {
        if (!isSelectingRef.current && !window.getSelection()?.toString()) {
            onBlockClick(blockId);
        }
    };

    // noinspection FunctionWithMultipleReturnPointsJS
    return (
        <>
            <style>{jsonBlockStyles}</style>
            <div
                className="json-block"
                data-line-index={index}
                data-source-line={index + 1}
                id={blockId}
                tabIndex={0}
                role="button"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            >
                <div className="json-header">SDG Entry #{index + 1}</div>

                <div className="json-content">
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

                    {parsedMetadata && (
                        <div className="metadata-section">
                            <div className="mb-2 text-sm font-medium">Metadata:</div>
                            {Object.entries(parsedMetadata).map(([key, value], i) => (
                                <div className="metadata-item text-xs" key={i}>
                                    <span className="metadata-key">{key}:</span>
                                    <span className="metadata-value">
                                        {typeof value === 'string'
                                            ? key === 'domain'
                                                ? stripHtmlTags(value)
                                                : value
                                            : JSON.stringify(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {id && <div className="mb-1 mt-2 text-xs text-gray-500">ID: {id}</div>}
                </div>
            </div>
        </>
    );
};

/** Interface for the JsonPlainBlock component */
interface IJsonPlainBlockProps {
    /** The index of the block. */
    index: number;

    /** The content of the block. */
    content: string;

    /** The function to call when the block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/**
 * JsonPlainBlock component for displaying non-SDG entries as preformatted text.
 *
 * @param {IJsonPlainBlockProps} props - The props for the JsonPlainBlock component.
 * @returns {React.ReactElement} The JsonPlainBlock component.
 */
export const JsonPlainBlock: React.FC<IJsonPlainBlockProps> = ({ index, content, onBlockClick }) => {
    const blockId = `formatted-line-${index}`;
    const isSelectingRef = useRef(false);

    // Handle mouse down to detect potential text selection
    const handleMouseDown = () => {
        isSelectingRef.current = false;
    };

    // Handle mouse move to detect if user is dragging (selecting text)
    const handleMouseMove = () => {
        if (window.getSelection()?.toString()) {
            isSelectingRef.current = true;
        }
    };

    // Handle click only if not selecting text
    const handleClick = () => {
        if (!isSelectingRef.current && !window.getSelection()?.toString()) {
            onBlockClick(blockId);
        }
    };

    return (
        <pre
            className="bg-gray-50 px-4 py-2 text-black"
            data-line-index={index}
            data-source-line={index + 1}
            id={blockId}
            tabIndex={0}
            role="button"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            {content}
        </pre>
    );
};
