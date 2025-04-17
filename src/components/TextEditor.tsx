import { useStore } from '@nanostores/react';
import React, { useEffect, useRef, useState } from 'react';
import { $sdgStore, autoFormatContent, setContent } from '../stores/sdgStore.js';
import { RESET_EVENT } from './InputActions.js';

/**
 * TextEditor component for displaying and editing JSONL content.
 *
 * This component is responsible for displaying the JSONL content in a formatted or raw view, and for automatically
 * formatting the content when it changes.
 */
export function TextEditor(): React.ReactElement {
    const { content, formattedContent, isProcessing } = useStore($sdgStore);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [displayMode, setDisplayMode] = useState<'raw' | 'formatted'>('raw');

    // When formattedContent changes, update the display mode to formatted.
    useEffect(() => {
        if (formattedContent) {
            setDisplayMode('formatted');
        }
    }, [formattedContent]);

    // When content changes (but not due to formatting), reset to raw mode.
    useEffect(() => {
        if (content && !formattedContent) {
            setDisplayMode('raw');
        }
    }, [content, formattedContent]);

    // When content is cleared, reset to raw mode.
    useEffect(() => {
        if (!content && !formattedContent) {
            setDisplayMode('raw');
        }
    }, [content, formattedContent]);

    // Automatically trigger the inspection process when content changes.
    useEffect(() => {
        if (content.trim() && !isProcessing && !formattedContent) {
            autoFormatContent();
        }
    }, [content, isProcessing, formattedContent]);

    // Ensure textarea content is synced with store.
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = content;
        }
    }, [content]);

    // Listen for reset event.
    useEffect(() => {
        const handleReset = (): void => {
            setDisplayMode('raw');
            if (textareaRef.current) {
                textareaRef.current.value = '';
            }
        };

        document.addEventListener(RESET_EVENT, handleReset);

        return () => {
            document.removeEventListener(RESET_EVENT, handleReset);
        };
    }, []);

    /**
     * Handle content changes.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
     * @returns {void}
     */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setContent(e.target.value);
    };

    /**
     * Handle paste event directly into the textarea.
     *
     * @returns {void}
     */
    const handlePaste = (): void => {
        // We need a slight delay to allow the textarea to update.
        setTimeout(() => {
            if (textareaRef.current) {
                setContent(textareaRef.current.value);
                autoFormatContent();
            }
        }, 10);
    };

    /**
     * Toggle between raw and formatted display.
     *
     * @returns {void}
     */
    const handleToggleDisplay = (): void => {
        setDisplayMode(displayMode === 'raw' ? 'formatted' : 'raw');

        // If switching to raw, ensure the textarea is in sync with the content state.
        if (displayMode === 'formatted' && textareaRef.current) {
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = content;
                }
            }, 0);
        }
    };

    const sdgStyles = `
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

        .json-block {
            margin: 16px 0;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            overflow: hidden;
        }

        .json-header {
            background-color: #f6f8fa;
            padding: 8px 12px;
            border-bottom: 1px solid #e1e4e8;
            font-family: monospace;
            font-size: 12px;
            color: #586069;
        }

        .json-content {
            padding: 12px;
            background-color: white;
        }

        .resizable-container {
            resize: both;
            overflow: auto;
            min-height: 24rem; /* 384px (same as h-96) */
            max-height: 90vh;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 1rem;
        }

        .resizable-container::after {
            content: '';
            position: absolute;
            bottom: 3px;
            right: 3px;
            width: 10px;
            height: 10px;
            cursor: nwse-resize;
            background: linear-gradient(
                135deg,
                transparent 50%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(0, 0, 0, 0.2)
            );
            border-radius: 0 0 2px 0;
        }
    `;

    // Only show the content if we have something to display.
    const showFormattedView = displayMode === 'formatted' && formattedContent;

    return (
        <div className="w-full">
            <div className="mb-2 flex justify-between">
                <div>
                    {formattedContent && (
                        <button
                            onClick={handleToggleDisplay}
                            className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                        >
                            {displayMode === 'raw' ? 'Show Formatted' : 'Show Raw'}
                        </button>
                    )}
                </div>

                {showFormattedView && (
                    <div className="text-xs text-gray-500">↘️ Container is resizable from the bottom-right corner</div>
                )}
            </div>

            {showFormattedView ? (
                <div className="relative">
                    <style>{sdgStyles}</style>

                    <div
                        className="resizable-container position-relative font-mono"
                        dangerouslySetInnerHTML={{
                            __html: formatHtmlDisplay(formattedContent)
                        }}
                    />
                </div>
            ) : (
                <textarea
                    id="text-editor"
                    ref={textareaRef}
                    className="h-96 w-full rounded-md border border-gray-300 p-4 font-mono focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste the SDG JSONL content here, or use the buttons above to upload or select an example."
                    onChange={handleChange}
                    onPaste={handlePaste}
                    disabled={isProcessing}
                    value={content}
                />
            )}
        </div>
    );
}

// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Format the JSONL content for HTML display.
 *
 * @param {string} content - The JSONL content to format.
 * @returns {string} The formatted HTML content.
 */
function formatHtmlDisplay(content: string): string {
    if (!content) {
        return '';
    }

    // Split the content into lines.
    // noinspection FunctionWithMultipleReturnPointsJS
    return content
        .split('\n')
        .map((line, index) => {
            try {
                const obj = JSON.parse(line);

                if (obj.messages && Array.isArray(obj.messages)) {
                    // noinspection FunctionWithMultipleReturnPointsJS
                    return `
                        <div class="json-block">
                            <div class="json-header">SDG Entry #${index + 1}</div>

                            <div class="json-content">
                                ${obj.messages
                                    .map((msg: { content?: string; role?: string }) => {
                                        if (!msg.content) {
                                            return '';
                                        }

                                        return `
                                            <div class="my-2">
                                                <div class="text-xs text-gray-500 mb-1">Role: ${msg.role ?? 'unknown'}</div>

                                            <div>${msg.content}</div>
                                        </div>
                                    `;
                                    })
                                    .join('')}

                                ${obj.id ? `<div class="text-xs text-gray-500 mt-2">ID: ${obj.id}</div>` : ''}
                            </div>
                        </div>
                    `;
                }

                return `<pre class="my-2 p-2 bg-gray-50 rounded overflow-x-auto">${escapeHtml(line)}</pre>`;
            } catch {
                return `<pre class="my-2 p-2 bg-gray-50 rounded overflow-x-auto">${escapeHtml(line)}</pre>`;
            }
        })
        .join('\n');
}

/**
 * Escape HTML special characters.
 *
 * @param {string} unsafe - The unsafe string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
