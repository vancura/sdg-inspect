import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState, Text } from '@codemirror/state';
import { EditorView, ViewUpdate, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $sdgStore, autoFormatContent, setContent } from '../stores/sdgStore.js';
import { RESET_EVENT } from './InputActions.js';

// Custom syntax highlighting theme
const jsonHighlightStyle = HighlightStyle.define([
    { tag: tags.string, color: '#a11' },
    { tag: tags.number, color: '#164' },
    { tag: tags.bool, color: '#219' },
    { tag: tags.null, color: '#219' },
    { tag: tags.propertyName, color: '#00c' },
    { tag: tags.punctuation, color: '#555' },
    { tag: tags.brace, color: '#555' },
    { tag: tags.bracket, color: '#555' }
]);

/**
 * TextEditor component with CodeMirror for editing and previewing JSONL content.
 *
 * This component displays JSONL in a full-featured code editor in the left panel, and shows a formatted preview in the
 * right panel with bidirectional highlighting.
 */
export function TextEditor(): React.ReactElement {
    const { content, formattedContent, isProcessing } = useStore($sdgStore);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const currentCursorPositionRef = useRef<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLine, setCurrentLine] = useState<number>(1);
    const [debugMessage, setDebugMessage] = useState<string>('');

    // Flag to prevent recursive selections
    const isSelectingRef = useRef(false);

    // Create or update the editor
    useEffect(() => {
        if (!editorRef.current) return;

        if (!editorViewRef.current) {
            // Initial editor creation
            const state = EditorState.create({
                doc: content,
                extensions: [
                    lineNumbers(),
                    highlightActiveLine(),
                    history(),
                    json(),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    syntaxHighlighting(jsonHighlightStyle),
                    EditorView.lineWrapping, // Enable line wrapping
                    EditorView.theme({
                        '&': {
                            height: '100%',
                            fontSize: '13px',
                            fontFamily: '"IBM Plex Mono", monospace !important'
                        },
                        '.cm-scroller': {
                            overflow: 'auto',
                            fontFamily: '"IBM Plex Mono", monospace !important'
                        },
                        '&.cm-editor.cm-focused': {
                            outline: 'none'
                        },
                        '.cm-line': {
                            padding: '0 4px',
                            cursor: 'pointer',
                            marginBottom: '4px' // Add space between lines
                        },
                        '.cm-activeLineGutter': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        '.cm-content': {
                            padding: '10px 0',
                            fontFamily: '"IBM Plex Mono", monospace !important'
                        },
                        '.cm-activeLine': {
                            backgroundColor: 'rgba(255, 255, 100, 0.1)'
                        },
                        // Apply the same font to all text in the editor
                        '.cm-gutters': {
                            fontFamily: '"IBM Plex Mono", monospace !important'
                        }
                    }),
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        if (update.docChanged) {
                            const newContent = update.state.doc.toString();
                            handleContentChange(newContent);
                        }

                        // Track ALL cursor movements, even tiny ones
                        // This ensures we always highlight the block when the cursor moves
                        const cursorPos = update.state.selection.main.head;

                        // Store cursor position for later restoration
                        currentCursorPositionRef.current = cursorPos;

                        // Handle cursor position change - highlight corresponding preview block
                        handleCursorPositionChanged(cursorPos);
                    })
                ]
            });

            const view = new EditorView({
                state,
                parent: editorRef.current
            });

            editorViewRef.current = view;
        } else if (content !== editorViewRef.current.state.doc.toString()) {
            // Save cursor position
            const currentPos = currentCursorPositionRef.current;

            // Update editor content if it doesn't match the store
            editorViewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: editorViewRef.current.state.doc.length,
                    insert: content
                },
                // Restore cursor position
                selection: { anchor: Math.min(currentPos, content.length) }
            });

            // Ensure the editor keeps focus after content change
            setTimeout(() => {
                if (editorViewRef.current) {
                    editorViewRef.current.focus();
                }
            }, 0);
        }

        return () => {
            if (editorViewRef.current) {
                editorViewRef.current.destroy();
                editorViewRef.current = null;
            }
        };
    }, [content, editorRef.current]);

    /** Debounced function to format content after typing stops. */
    const debouncedFormatContent = useCallback(() => {
        if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
            if (content.trim()) {
                // Store current cursor position before formatting
                if (editorViewRef.current) {
                    currentCursorPositionRef.current = editorViewRef.current.state.selection.main.head;
                }

                autoFormatContent();
            }
            debounceTimerRef.current = null;
        }, 500); // 500ms debounce delay
    }, [content]);

    /** Handle content changes in the editor. */
    const handleContentChange = useCallback(
        (newContent: string) => {
            if (newContent !== content) {
                // Compute cursor adjustment based on length change
                const lengthDiff = newContent.length - content.length;
                const cursorPos = currentCursorPositionRef.current;

                // Update content
                setContent(newContent);

                // If content is empty, clear the formatted content immediately
                if (!newContent.trim()) {
                    // Let store know to clear formatted content
                    setTimeout(() => autoFormatContent(), 0);
                } else {
                    debouncedFormatContent();
                }

                // Make sure to call focus and restore cursor after any state updates
                if (editorViewRef.current) {
                    // Use setTimeout to ensure this happens after React updates
                    setTimeout(() => {
                        if (editorViewRef.current) {
                            // For additions, adjust cursor forward by difference
                            // For deletions, keep cursor at current position
                            const newPos =
                                lengthDiff > 0
                                    ? Math.min(cursorPos + lengthDiff, newContent.length)
                                    : Math.min(cursorPos, newContent.length);

                            // Set cursor position explicitly
                            editorViewRef.current.dispatch({
                                selection: { anchor: newPos }
                            });

                            // Ensure focus
                            editorViewRef.current.focus();
                        }
                    }, 0);
                }
            }
        },
        [content, debouncedFormatContent]
    );

    /** Convert position to line number in the editor */
    const getLineNumberFromPosition = (doc: Text, position: number): number => {
        return doc.lineAt(position).number - 1; // 0-based index
    };

    /** Get the start position of a line */
    const getLineStartPosition = useCallback((lineIndex: number): number => {
        if (!editorViewRef.current) return 0;

        try {
            const doc = editorViewRef.current.state.doc;
            const line = doc.line(lineIndex + 1); // Convert to 1-based
            return line.from;
        } catch (error) {
            console.error('Error getting line start position:', error);
            return 0;
        }
    }, []);

    /** Clear all highlights in both editor and preview */
    const clearAllHighlights = () => {
        // Clear preview highlights
        if (previewRef.current) {
            previewRef.current.querySelectorAll('.active-block, .preview-block-highlight').forEach((el) => {
                el.classList.remove('active-block');
                el.classList.remove('preview-block-highlight');
            });
        }
    };

    /** Handle cursor position changes in the editor */
    const handleCursorPositionChanged = useCallback(
        (pos: number) => {
            if (!editorViewRef.current) return;

            // Get the line number at the cursor position
            const line = editorViewRef.current.state.doc.lineAt(pos);
            const lineNumber = line.number;

            // Update current line state
            setCurrentLine(lineNumber);

            // Clear all previous highlights first
            if (previewRef.current) {
                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                // Find and highlight the corresponding element in the preview
                const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                if (sourceElement) {
                    // Add highlight class
                    sourceElement.classList.add('preview-block-highlight');

                    // Scroll the element into view at the top
                    sourceElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    setDebugMessage(`Highlighted line ${lineNumber} via cursor position`);
                }
            }
        },
        [previewRef.current, setCurrentLine, setDebugMessage]
    );

    /** Apply IDs to formatted elements for line mapping */
    useEffect(() => {
        // Only need to add data attributes, not event listeners
        if (formattedContent) {
            // Wait for DOM to update with formatted content
            const timerId = setTimeout(() => {
                // Add data attributes to each JSON block and pre element
                document.querySelectorAll('.json-block, pre').forEach((block, index) => {
                    block.setAttribute('data-line-index', index.toString());
                    block.setAttribute('data-source-line', (index + 1).toString());
                    block.id = `formatted-line-${index}`;
                });
            }, 100);

            return () => {
                clearTimeout(timerId);
            };
        } else if (!formattedContent && previewRef.current) {
            // If there's no formatted content, ensure preview is cleared
            previewRef.current.innerHTML = '';
        }
    }, [formattedContent]);

    // Add a helper function to scroll the editor to a specific line
    const scrollEditorToLine = useCallback(
        (lineNumber: number) => {
            if (!editorViewRef.current) return;

            try {
                // Get the line position in the document
                const line = editorViewRef.current.state.doc.line(lineNumber);
                const linePos = line.from;

                // Create a scroll-into-view transaction
                const scrollTransaction = editorViewRef.current.state.update({
                    effects: EditorView.scrollIntoView(linePos, { y: 'start', yMargin: 50 })
                });

                // Dispatch the transaction
                editorViewRef.current.dispatch(scrollTransaction);

                // Also ensure the line is highlighted in the editor
                setTimeout(() => {
                    if (editorViewRef.current) {
                        // This additional dispatch ensures the active line highlight is visible
                        editorViewRef.current.dispatch({
                            selection: { anchor: linePos }
                        });
                    }
                }, 10);
            } catch (error) {
                console.error('Error scrolling editor to line:', error);
            }
        },
        [editorViewRef.current]
    );

    // Update event handler and dependency array in previewRef effect
    useEffect(() => {
        const handlePreviewClick = (e: MouseEvent) => {
            // Find the closest .json-block or pre element
            const target = e.target as HTMLElement;
            const blockElement = target.closest('.json-block, pre') as HTMLElement | null;

            if (blockElement && previewRef.current) {
                setDebugMessage(`Clicked block: ${blockElement.id}`);
                console.log('Block clicked:', blockElement.id);

                // Prevent default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();

                // Remove highlight from all elements first
                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                // Add highlight to the clicked element
                blockElement.classList.add('preview-block-highlight');

                // Get line index from data attribute
                const lineIndex = parseInt(blockElement.getAttribute('data-line-index') || '0', 10);

                // Scroll element into view (align to top)
                blockElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Move cursor to this line in editor and force cursor change handling
                if (editorViewRef.current) {
                    const pos = getLineStartPosition(lineIndex);

                    // Move cursor to this position but don't create a selection
                    editorViewRef.current.dispatch({
                        selection: { anchor: pos, head: pos }
                    });

                    // Focus the editor
                    editorViewRef.current.focus();

                    // Scroll the editor to the corresponding line
                    scrollEditorToLine(lineIndex + 1); // Convert to 1-based line numbers

                    // Manually trigger cursor position handling to ensure highlighting
                    handleCursorPositionChanged(pos);
                }
            } else {
                setDebugMessage('No .json-block or pre element found');
            }
        };

        // Add single event listener to the preview container
        const previewElement = previewRef.current;
        if (previewElement) {
            // Remove any existing listeners first to avoid duplicates
            previewElement.removeEventListener('click', handlePreviewClick as EventListener);
            // Add the click listener
            previewElement.addEventListener('click', handlePreviewClick as EventListener);

            console.log('Click handler attached to preview element');
        }

        // Clean up
        return () => {
            if (previewElement) {
                previewElement.removeEventListener('click', handlePreviewClick as EventListener);
            }
        };
    }, [previewRef.current, getLineStartPosition, handleCursorPositionChanged, scrollEditorToLine]);

    // Listen for reset event.
    useEffect(() => {
        const handleReset = (): void => {
            if (editorViewRef.current) {
                editorViewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: editorViewRef.current.state.doc.length,
                        insert: ''
                    }
                });
            }

            // Clear all highlights
            clearAllHighlights();
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

    // Update the global click handler to also scroll the editor
    useEffect(() => {
        // Define a handler function that will be called from HTML
        const blockClickHandler = (blockId: string) => {
            const element = document.getElementById(blockId);
            if (element && previewRef.current) {
                setDebugMessage(`Block clicked via global handler: ${blockId}`);

                // Remove highlight from all elements
                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                // Add highlight to the clicked element
                element.classList.add('preview-block-highlight');

                // Scroll to this element
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Handle editor focus based on data attribute
                const lineIndex = parseInt(element.getAttribute('data-line-index') || '0', 10);
                if (editorViewRef.current) {
                    const pos = getLineStartPosition(lineIndex);

                    // Move cursor to this position but don't create a selection
                    editorViewRef.current.dispatch({
                        selection: { anchor: pos, head: pos }
                    });

                    // Focus the editor
                    editorViewRef.current.focus();

                    // Scroll the editor to the corresponding line
                    scrollEditorToLine(lineIndex + 1); // Convert to 1-based line numbers

                    // Manually trigger cursor position handling
                    handleCursorPositionChanged(pos);
                }
            }
        };

        // Assign to window for global access from HTML
        (window as any).handleBlockClick = blockClickHandler;

        // Cleanup
        return () => {
            delete (window as any).handleBlockClick;
        };
    }, [getLineStartPosition, handleCursorPositionChanged, scrollEditorToLine]);

    // Add an effect to highlight the current line whenever formatted content is updated or focus changes
    useEffect(() => {
        if (formattedContent && editorViewRef.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                const cursorPos = currentCursorPositionRef.current;
                handleCursorPositionChanged(cursorPos);
            }, 100);
        }
    }, [formattedContent, handleCursorPositionChanged]);

    // Add keyboard event tracking to editor to enhance cursor movement detection
    useEffect(() => {
        if (!editorViewRef.current) return;

        // Create a handler for key events in the editor
        const handleEditorKeyEvents = (event: KeyboardEvent) => {
            // Small delay to let cursor position update
            setTimeout(() => {
                // Get current cursor position and highlight corresponding block
                if (editorViewRef.current) {
                    const cursorPos = editorViewRef.current.state.selection.main.head;
                    handleCursorPositionChanged(cursorPos);
                }
            }, 10);
        };

        // Get the editor DOM node
        const editorDom = editorViewRef.current.dom;

        // Add keyboard event listeners
        editorDom.addEventListener('keydown', handleEditorKeyEvents);
        editorDom.addEventListener('keyup', handleEditorKeyEvents);

        // Clean up
        return () => {
            editorDom.removeEventListener('keydown', handleEditorKeyEvents);
            editorDom.removeEventListener('keyup', handleEditorKeyEvents);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    // Add mouse event tracking to editor to enhance cursor movement detection
    useEffect(() => {
        if (!editorViewRef.current) return;

        // Create a handler for mouse events in the editor
        const handleEditorMouseEvents = () => {
            // Small delay to let cursor position update
            setTimeout(() => {
                // Get current cursor position and highlight corresponding block
                if (editorViewRef.current) {
                    const cursorPos = editorViewRef.current.state.selection.main.head;
                    handleCursorPositionChanged(cursorPos);
                }
            }, 10);
        };

        // Get the editor DOM node
        const editorDom = editorViewRef.current.dom;

        // Add mouse event listeners
        editorDom.addEventListener('mouseup', handleEditorMouseEvents);
        editorDom.addEventListener('mousedown', handleEditorMouseEvents);
        editorDom.addEventListener('click', handleEditorMouseEvents);

        // Clean up
        return () => {
            editorDom.removeEventListener('mouseup', handleEditorMouseEvents);
            editorDom.removeEventListener('mousedown', handleEditorMouseEvents);
            editorDom.removeEventListener('click', handleEditorMouseEvents);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    // Let's also add a focus event handler to ensure blocks are highlighted when the editor gets focus
    useEffect(() => {
        if (!editorViewRef.current) return;

        const handleEditorFocus = () => {
            // Get current cursor position and highlight corresponding block
            if (editorViewRef.current) {
                const cursorPos = editorViewRef.current.state.selection.main.head;
                handleCursorPositionChanged(cursorPos);
            }
        };

        const editorDom = editorViewRef.current.dom;
        editorDom.addEventListener('focus', handleEditorFocus);

        return () => {
            editorDom.removeEventListener('focus', handleEditorFocus);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    // Add keyboard arrow key specific tracking for more reliable navigation detection
    useEffect(() => {
        if (!editorViewRef.current) return;

        // Create a handler specifically for arrow key navigation
        const handleArrowKeys = (event: KeyboardEvent) => {
            // Check if arrow keys were pressed
            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowRight'
            ) {
                // Immediately update on arrow key for better responsiveness
                setTimeout(() => {
                    if (editorViewRef.current) {
                        const cursorPos = editorViewRef.current.state.selection.main.head;
                        handleCursorPositionChanged(cursorPos);
                    }
                }, 0); // Use minimal delay for arrow keys
            }
        };

        const editorDom = editorViewRef.current.dom;
        editorDom.addEventListener('keydown', handleArrowKeys);

        return () => {
            editorDom.removeEventListener('keydown', handleArrowKeys);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    // Add a regular polling mechanism to ensure highlighting is maintained
    useEffect(() => {
        if (!editorViewRef.current) return;

        // Create a polling function that periodically checks cursor position
        const checkCursorPosition = () => {
            if (editorViewRef.current && document.activeElement === editorViewRef.current.dom) {
                const cursorPos = editorViewRef.current.state.selection.main.head;
                const line = editorViewRef.current.state.doc.lineAt(cursorPos);
                const lineNumber = line.number;

                // Only update if we have a preview reference
                if (previewRef.current) {
                    // Find the corresponding element in the preview
                    const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                    const highlightedElement = previewRef.current.querySelector('.preview-block-highlight');

                    // Only update if the highlight needs to change
                    if (
                        sourceElement &&
                        (!highlightedElement || !sourceElement.classList.contains('preview-block-highlight'))
                    ) {
                        // Call the handler to update highlighting
                        handleCursorPositionChanged(cursorPos);
                    }
                }
            }
        };

        // Set up an interval to poll cursor position every 1000ms (1 second)
        const intervalId = setInterval(checkCursorPosition, 1000);

        // Clean up
        return () => {
            clearInterval(intervalId);
        };
    }, [editorViewRef.current, previewRef.current, handleCursorPositionChanged]);

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

    /* Active block highlight */
    .active-block {
        border-color: #0366d6;
        box-shadow: 0 0 0 2px #0366d6;
        background-color: rgba(3, 102, 214, 0.05);
    }

    /* Preview block highlight - improved styles */
    .preview-block-highlight {
        border: 3px solid #0366d6 !important;
        box-shadow: 0 0 12px rgba(3, 102, 214, 0.7) !important;
        background-color: rgba(3, 102, 214, 0.1) !important;
        position: relative;
        z-index: 1;
        outline: none;
        transform: translateZ(0);
    }

    /* Special highlight indicator for json blocks */
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

    /* Improve cursor on clickable elements */
    .json-block, pre {
        cursor: pointer;
    }

    /* Make sure the container scrolls properly */
    .json-scroller {
        overflow-y: auto;
        scroll-behavior: smooth;
        height: 100%;
    }
`;

    return (
        <div className="relative flex h-full w-full font-sans">
            {/* Left column - CodeMirror editor */}
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

                <div
                    ref={editorRef}
                    className="flex-1 overflow-hidden rounded-md border border-gray-300 font-mono text-sm"
                    style={{ fontFamily: '"IBM Plex Mono", monospace' }}
                />
            </div>

            {/* Right column - formatted content (live preview) */}
            <div className="relative h-full w-2/3 overflow-hidden">
                {formattedContent ? (
                    <div className="json-scroller relative h-full w-full overflow-y-auto px-4" ref={previewRef}>
                        <style>{sdgStyles}</style>
                        <div
                            className="w-full font-mono"
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
    return content
        .split('\n')
        .map((line, index) => {
            try {
                const obj = JSON.parse(line);

                if (obj.messages && Array.isArray(obj.messages)) {
                    return `
                        <div class="json-block"
                            data-line-index="${index}"
                            data-source-line="${index + 1}"
                            id="formatted-line-${index}"
                            tabindex="0"
                            role="button"
                            onclick="window.handleBlockClick && window.handleBlockClick('formatted-line-${index}')">
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

                return `<pre class="my-2 p-2 bg-gray-50 rounded overflow-x-auto" data-line-index="${index}" data-source-line="${index + 1}" id="formatted-line-${index}" tabindex="0" role="button" onclick="window.handleBlockClick && window.handleBlockClick('formatted-line-${index}')">${escapeHtml(line)}</pre>`;
            } catch {
                return `<pre class="my-2 p-2 bg-gray-50 rounded overflow-x-auto" data-line-index="${index}" data-source-line="${index + 1}" id="formatted-line-${index}" tabindex="0" role="button" onclick="window.handleBlockClick && window.handleBlockClick('formatted-line-${index}')">${escapeHtml(line)}</pre>`;
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
