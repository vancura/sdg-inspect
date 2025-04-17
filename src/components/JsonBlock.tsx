import React from 'react';

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
    );
};

/**
 * JsonPlainBlock component for displaying non-SDG entries as preformatted text.
 *
 * @param {IJsonPlainBlockProps} props - The props for the JsonPlainBlock component.
 * @returns {React.ReactElement} The JsonPlainBlock component.
 */
export const JsonPlainBlock: React.FC<{
    /** The index of the block. */
    index: number;

    /** The content of the block. */
    content: string;

    /** The function to call when the block is clicked. */
    onBlockClick: (blockId: string) => void;
}> = ({ index, content, onBlockClick }) => {
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
