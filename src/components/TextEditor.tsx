import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useRef } from 'react';
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
    const debounceTimerRef = useRef<number | null>(null);

    /** Debounced function to format content after typing stops. */
    const debouncedFormatContent = useCallback(() => {
        if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
            if (content.trim()) {
                autoFormatContent();
            }
            debounceTimerRef.current = null;
        }, 500); // 500ms debounce delay
    }, [content]);

    // Automatically trigger the inspection process when content changes.
    useEffect(() => {
        if (content.trim() && !isProcessing) {
            debouncedFormatContent();
        }
    }, [content, isProcessing, debouncedFormatContent]);

    // Ensure textarea content is synced with store.
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = content;
        }
    }, [content]);

    // Listen for reset event.
    useEffect(() => {
        const handleReset = (): void => {
            if (textareaRef.current) {
                textareaRef.current.value = '';
            }
        };

        document.addEventListener(RESET_EVENT, handleReset);

        return () => {
            document.removeEventListener(RESET_EVENT, handleReset);
            // Clear any pending debounce timer on unmount
            if (debounceTimerRef.current) {
                window.clearTimeout(debounceTimerRef.current);
            }
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
        // Debounced formatting will be triggered by the useEffect
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
                // Immediately format pasted content without debounce
                autoFormatContent();
            }
        }, 10);
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
    `;

    return (
        <div className="relative flex h-full w-full">
            {/* Left column - always visible textarea */}
            <div className="flex h-full w-1/3 flex-col border-r border-fuchsia-300 p-4">
                <div className="mb-2 flex justify-between">
                    <div>
                        {content && (
                            <div className="text-xs">
                                <span className="font-medium text-green-600">Live Preview Enabled</span>
                                {isProcessing && <span className="ml-2 text-amber-600">Updating preview...</span>}
                            </div>
                        )}
                    </div>
                </div>

                <textarea
                    id="text-editor"
                    ref={textareaRef}
                    className="w-full flex-1 rounded-md border border-gray-300 p-4 font-mono focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste the SDG JSONL content here, or use the buttons above to upload or select an example."
                    onChange={handleChange}
                    onPaste={handlePaste}
                    disabled={isProcessing}
                    value={content}
                />
            </div>

            {/* Right column - formatted content (live preview) */}
            <div className="relative h-full w-2/3 overflow-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-1">
                    <div className="text-xs">
                        {isProcessing ? (
                            <span className="text-amber-600">Updating preview...</span>
                        ) : content && formattedContent ? (
                            <span className="text-green-600">Preview up-to-date</span>
                        ) : content && !formattedContent ? (
                            <span className="text-amber-600">Processing content...</span>
                        ) : (
                            <span>Waiting for input</span>
                        )}
                    </div>

                    {/* Current indicator */}
                    <div className="text-3xl font-bold text-fuchsia-500">CURRENT</div>
                </div>

                {formattedContent ? (
                    <div className="relative h-full px-4 py-4 pt-8">
                        <style>{sdgStyles}</style>
                        <div
                            className="h-full w-full font-mono"
                            dangerouslySetInnerHTML={{
                                __html: formatHtmlDisplay(formattedContent)
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center p-4 pt-16">
                        <div className="text-gray-500">
                            {content && isProcessing
                                ? 'Formatting content for preview...'
                                : content
                                  ? 'Processing your JSONL content...'
                                  : 'Preview will appear here when content is entered'}
                        </div>
                    </div>
                )}
            </div>
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
