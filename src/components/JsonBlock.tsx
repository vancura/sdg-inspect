import React, { createContext, useCallback, useContext, useRef } from 'react';

// Style context to prevent duplicate style tags
const StyleContext = createContext(false);

/** Common styles for the SDG tags */
const sdgTagStyle = `
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 4px;
    display: inline-block;
    margin: 4px 0;
`;

/** Common styles for the SDG blocks */
const sdgBlockStyle = `
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: 0 4px 4px 0;
    white-space: pre-wrap;
`;

/** Styles for SDG-specific elements */
export const sdgStyles = `
    .sdg-user-tag {
        color: #005cc5;
        background-color: rgba(0, 92, 197, 0.1);
        ${sdgTagStyle}
    }

    .sdg-assistant-tag {
        color: #22863a;
        background-color: rgba(34, 134, 58, 0.1);
        ${sdgTagStyle}
    }

    .sdg-question {
        background-color: rgba(0, 92, 197, 0.1);
        border-left: 3px solid #005cc5;
        ${sdgBlockStyle}
    }

    .sdg-answer {
        background-color: rgba(34, 134, 58, 0.1);
        border-left: 3px solid #22863a;
        ${sdgBlockStyle}
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

    pre.json-plain-block {
        margin: 0 0 16px;
        background-color: rgba(255, 255, 255, 0.7);
        color: black;
    }

    .preview-block-highlight pre.json-plain-block {
        background: rgba(255, 255, 255, 0.9);
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

/** Base interface for block components */
interface IBaseBlockProps {
    /** The index of the block. */
    index: number;

    /** The function to call when the block is clicked. */
    onBlockClick: (blockId: string) => void;
}

/** Interface for the JsonBlock component */
interface IJsonBlockProps extends IBaseBlockProps {
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
}

/** Interface for the JsonPlainBlock component */
interface IJsonPlainBlockProps extends IBaseBlockProps {
    /** The content of the block. */
    content: string;
}

/**
 * Custom hook to handle text selection and click behavior
 *
 * @param blockId - The ID of the block
 * @param onBlockClick - Callback function when block is clicked
 * @returns Object containing event handlers for mouse interactions
 */
const useSelectionAwareClick = (blockId: string, onBlockClick: (blockId: string) => void) => {
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
        if (!isSelectingRef.current && !window.getSelection()?.toString()) {
            onBlockClick(blockId);
        }
    }, [blockId, onBlockClick]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleClick
    };
};

/**
 * Creates a block ID from an index
 *
 * @param index - The block index
 * @returns The formatted block ID
 */
const getBlockId = (index: number): string => `formatted-line-${index}`;

/**
 * Strips HTML tags from a string.
 *
 * @param {string} html - The string containing HTML to strip.
 * @returns {string} The string with HTML tags removed.
 */
const stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(?:>|$)/g, '');
};

/**
 * Parses metadata string to object with error handling
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

/** Metadata display component */
const MetadataSection: React.FC<{ metadata: Record<string, any> }> = ({ metadata }) => (
    <div className="metadata-section">
        <div className="mb-2 text-sm font-medium">Metadata:</div>
        {Object.entries(metadata).map(([key, value], i) => (
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
);

/** Base component for block elements with common functionality */
const BlockBase: React.FC<{
    blockId: string;
    index: number;
    onBlockClick: (blockId: string) => void;
    className: string;
    children: React.ReactNode;
}> = ({ blockId, index, onBlockClick, className, children }) => {
    const { handleMouseDown, handleMouseMove, handleClick } = useSelectionAwareClick(blockId, onBlockClick);

    return (
        <div
            className={className}
            data-line-index={index}
            data-source-line={index + 1}
            id={blockId}
            tabIndex={0}
            role="button"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            {children}
        </div>
    );
};

/** Pre-formatted text block with selection-aware click handling */
const PreBlock: React.FC<{
    blockId: string;
    index: number;
    onBlockClick: (blockId: string) => void;
    children: React.ReactNode;
}> = ({ blockId, index, onBlockClick, children }) => {
    const { handleMouseDown, handleMouseMove, handleClick } = useSelectionAwareClick(blockId, onBlockClick);

    return (
        <pre
            className="json-plain-block px-4 py-2"
            data-line-index={index}
            data-source-line={index + 1}
            id={blockId}
            tabIndex={0}
            role="button"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            {children}
        </pre>
    );
};

/** A wrapper component that includes both JSON and SDG styles */
const StyleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const stylesLoaded = useContext(StyleContext);

    // If styles are already loaded in the context, just render children
    if (stylesLoaded) {
        return <>{children}</>;
    }

    // Otherwise, render styles and children
    return (
        <StyleContext.Provider value={true}>
            <style>{jsonBlockStyles}</style>
            <style>{sdgStyles}</style>
            {children}
        </StyleContext.Provider>
    );
};

/** Global style provider that can be used at a higher level to ensure styles are only included once per page */
export const JsonBlockStyleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <StyleContext.Provider value={true}>
            <style>{jsonBlockStyles}</style>
            <style>{sdgStyles}</style>
            {children}
        </StyleContext.Provider>
    );
};

/**
 * JsonBlock component for displaying SDG entries in a formatted block.
 *
 * @param {IJsonBlockProps} props - The props for the JsonBlock component.
 * @returns {React.ReactElement} The JsonBlock component.
 */
export const JsonBlock: React.FC<IJsonBlockProps> = ({ index, id, messages, metadata, onBlockClick }) => {
    const blockId = getBlockId(index);
    const parsedMetadata = parseMetadata(metadata);

    return (
        <StyleProvider>
            <BlockBase blockId={blockId} index={index} onBlockClick={onBlockClick} className="json-block">
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

                    {parsedMetadata && <MetadataSection metadata={parsedMetadata} />}

                    {id && <div className="mb-1 mt-2 text-xs text-gray-500">ID: {id}</div>}
                </div>
            </BlockBase>
        </StyleProvider>
    );
};

/**
 * JsonPlainBlock component for displaying non-SDG entries as preformatted text.
 *
 * @param {IJsonPlainBlockProps} props - The props for the JsonPlainBlock component.
 * @returns {React.ReactElement} The JsonPlainBlock component.
 */
export const JsonPlainBlock: React.FC<IJsonPlainBlockProps> = ({ index, content, onBlockClick }) => {
    const blockId = getBlockId(index);

    return (
        <StyleProvider>
            <PreBlock blockId={blockId} index={index} onBlockClick={onBlockClick}>
                {content}
            </PreBlock>
        </StyleProvider>
    );
};
