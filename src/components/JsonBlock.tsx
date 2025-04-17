import React from 'react';

/** Styles for JsonBlock and JsonPlainBlock components */
export const jsonBlockStyles = `
    .json-block {
        margin: 16px 0;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        font-family: "IBM Plex Mono", monospace;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
    }

    .json-block:hover {
        border-color: #0366d6;
        box-shadow: 0 0 0 1px #0366d6;
        transform: translateY(-2px);
    }

    .json-header {
        background-color: #f6f8fa;
        padding: 8px 12px;
        border-bottom: 1px solid #e1e4e8;
        font-family: "IBM Plex Mono", monospace;
        font-size: 12px;
        color: #586069;
    }

    .json-content {
        padding: 12px;
        background-color: white;
    }

    .json-block.preview-block-highlight .json-header {
        background-color: rgba(3, 102, 214, 0.2);
        border-bottom: 2px solid #0366d6;
        color: #0366d6;
        font-weight: bold;
    }

    .json-block.preview-block-highlight:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 6px;
        background-color: #0366d6;
    }

    .active-block {
        border-color: #0366d6;
        box-shadow: 0 0 0 2px #0366d6;
        background-color: rgba(3, 102, 214, 0.05);
    }

    .preview-block-highlight {
        border: 3px solid #0366d6 !important;
        box-shadow: 0 0 12px rgba(3, 102, 214, 0.7) !important;
        background-color: rgba(3, 102, 214, 0.1) !important;
        position: relative;
        z-index: 1;
        outline: none;
        transform: translateZ(0);
    }

    .json-block, pre {
        cursor: pointer;
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

    /** The function to call when the block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/**
 * JsonBlock component for displaying SDG entries in a formatted block.
 *
 * @param {IJsonBlockProps} props - The props for the JsonBlock component.
 * @returns {React.ReactElement} The JsonBlock component.
 */
export const JsonBlock: React.FC<IJsonBlockProps> = ({ index, id, messages, onBlockClick }) => {
    const blockId = `formatted-line-${index}`;

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
                onClick={() => onBlockClick(blockId)}
            >
                <div className="json-header">SDG Entry #{index + 1}</div>

                <div className="json-content">
                    {messages.map((msg, msgIndex) => {
                        if (!msg.content) return null;

                        return (
                            <div className="my-2" key={msgIndex}>
                                <div className="mb-1 text-xs text-gray-500">Role: {msg.role ?? 'unknown'}</div>
                                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                            </div>
                        );
                    })}
                    {id && <div className="mt-2 text-xs text-gray-500">ID: {id}</div>}
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

    return (
        <pre
            className="my-2 overflow-x-auto rounded bg-gray-50 p-2"
            data-line-index={index}
            data-source-line={index + 1}
            id={blockId}
            tabIndex={0}
            role="button"
            onClick={() => onBlockClick(blockId)}
        >
            {content}
        </pre>
    );
};
