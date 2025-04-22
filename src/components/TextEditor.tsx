import { EditorView } from '@codemirror/view';
import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useContentParser } from '../hooks/useContentParser.js';
import { useEditorEvents } from '../hooks/useEditorEvents.js';
import { $sdgStore, autoFormatContent, setContent } from '../stores/sdgStore.js';
import type { TypedEventListener } from '../types/editorTypes.js';
import { isTextSelected } from '../utils/blockUtils.js';
import {
    clearAllHighlights,
    clearIntervalSafe,
    clearTimeoutSafe,
    ensureEditorFocus,
    getElementByIdSafe,
    scrollElementIntoView
} from '../utils/editorUtils.js';
import { EditorPanel } from './EditorPanel.js';
import { RESET_EVENT } from './InputActions.js';
import { PreviewPanel } from './PreviewPanel.js';

// Import constants from editorTypes (will be removed when we fully adopt the constants).
const {
    IMMEDIATE: IMMEDIATE_TIMEOUT,
    SHORT: SHORT_TIMEOUT,
    MEDIUM: MEDIUM_TIMEOUT,
    LONG: LONG_TIMEOUT,
    CURSOR_CHECK_INTERVAL,
    SELECTION_CHECK: SELECTION_CHECK_TIMEOUT
} = {
    IMMEDIATE: 0,
    SHORT: 5,
    MEDIUM: 50,
    LONG: 300,
    CURSOR_CHECK_INTERVAL: 500,
    SELECTION_CHECK: 10
};

/**
 * TextEditor component with CodeMirror for editing and previewing JSONL content.
 *
 * This component displays JSONL in a full-featured code editor in the left panel and shows a formatted preview in the
 * right panel with bidirectional highlighting.
 */
export function TextEditor(): React.ReactElement {
    const { content, formattedContent } = useStore($sdgStore);
    const { parsedBlocks, parseFormattedContent } = useContentParser();

    // Refs for element access and state tracking.
    const editorViewRef = useRef<EditorView | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const currentCursorPositionRef = useRef<number>(0);
    const currentLineRef = useRef<number>(1);
    const isSelectingRef = useRef(false);

    // Utility functions.
    const ensureEditorFocusWithTimeout = useCallback((timeout = IMMEDIATE_TIMEOUT) => {
        if (editorViewRef.current) {
            ensureEditorFocus(editorViewRef, timeout);
        }
    }, []);

    const clearAllHighlightsInPreview = useCallback(() => {
        if (previewRef.current) {
            clearAllHighlights(previewRef as React.RefObject<HTMLDivElement>);
        }
    }, [previewRef]);

    // Editor handling.
    const handleEditorReady = useCallback((editorRef: React.MutableRefObject<EditorView | null>) => {
        editorViewRef.current = editorRef.current;
    }, []);

    // Handle cursor position changes.
    const handleCursorPositionChanged = useCallback(
        (pos: number) => {
            if (!editorViewRef.current) {
                return;
            }

            const line = editorViewRef.current.state.doc.lineAt(pos);
            const lineNumber = line.number;

            currentLineRef.current = lineNumber;
            currentCursorPositionRef.current = pos;

            if (previewRef.current) {
                clearAllHighlightsInPreview();

                const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                if (sourceElement) {
                    sourceElement.classList.add('preview-block-highlight');
                    scrollElementIntoView(sourceElement);
                }
            }
        },
        [previewRef.current, clearAllHighlightsInPreview]
    );

    // Use the editor events hook for event handling.
    useEditorEvents({
        editorViewRef,
        onCursorChange: handleCursorPositionChanged,
        defaultTimeout: SHORT_TIMEOUT,
        immediateTimeout: IMMEDIATE_TIMEOUT
    });

    // Content change handling with debouncing.
    const debouncedFormatContent = useCallback(() => {
        clearTimeoutSafe(debounceTimerRef);

        debounceTimerRef.current = window.setTimeout(() => {
            if (content.trim()) {
                if (editorViewRef.current) {
                    currentCursorPositionRef.current = editorViewRef.current.state.selection.main.head;
                }

                autoFormatContent();
            }
            debounceTimerRef.current = null;
        }, LONG_TIMEOUT);
    }, [content]);

    const handleContentChange = useCallback(
        (newContent: string) => {
            if (newContent !== content) {
                setContent(newContent);

                if (newContent.trim()) {
                    debouncedFormatContent();
                } else {
                    setTimeout(() => autoFormatContent(), IMMEDIATE_TIMEOUT);
                }
            }
        },
        [content, debouncedFormatContent]
    );

    // Get line start position for editor navigation.
    const getLineStartPosition = useCallback((lineIndex: number): number => {
        if (!editorViewRef.current) {
            return 0;
        }

        try {
            const doc = editorViewRef.current.state.doc;
            const line = doc.line(lineIndex + 1);
            return line.from;
        } catch (error) {
            console.error('Error getting line start position:', error);
            return 0;
        }
    }, []);

    // Scroll editor to specific line.
    const scrollEditorToLine = useCallback(
        (lineNumber: number) => {
            if (!editorViewRef.current) {
                return;
            }

            try {
                const line = editorViewRef.current.state.doc.line(lineNumber);
                const linePos = line.from;

                const scrollTransaction = editorViewRef.current.state.update({
                    effects: EditorView.scrollIntoView(linePos, { y: 'start', yMargin: 50 })
                });

                editorViewRef.current.dispatch(scrollTransaction);

                setTimeout(() => {
                    if (editorViewRef.current) {
                        editorViewRef.current.dispatch({
                            selection: { anchor: linePos }
                        });
                    }
                }, SHORT_TIMEOUT);
            } catch (error) {
                console.error('Error scrolling editor to line:', error);
            }
        },
        [editorViewRef.current]
    );

    // Sync elements between editor and preview.
    const syncElementWithEditor = useCallback(
        (element: HTMLElement) => {
            if (!element || !previewRef.current || isTextSelected()) {
                return;
            }

            // Clear existing highlights.
            clearAllHighlightsInPreview();

            // Add highlight to the element.
            element.classList.add('preview-block-highlight');

            // Scroll the element into view.
            scrollElementIntoView(element);

            // Get line index and sync with editor.
            const lineIndex = parseInt(element.getAttribute('data-line-index') ?? '0', 10);
            if (editorViewRef.current) {
                const pos = getLineStartPosition(lineIndex);

                editorViewRef.current.dispatch({
                    selection: { anchor: pos, head: pos }
                });

                ensureEditorFocusWithTimeout();
                scrollEditorToLine(lineIndex + 1);
                handleCursorPositionChanged(pos);
            }
        },
        [
            previewRef.current,
            editorViewRef.current,
            getLineStartPosition,
            scrollEditorToLine,
            handleCursorPositionChanged,
            clearAllHighlightsInPreview,
            ensureEditorFocusWithTimeout
        ]
    );

    // Handle clicking on blocks in the preview.
    const handleBlockClick = useCallback(
        (blockId: string) => {
            if (isTextSelected()) {
                return;
            }

            const element = getElementByIdSafe(blockId);
            if (element && previewRef.current) {
                syncElementWithEditor(element);
            }
        },
        [syncElementWithEditor]
    );

    // Set up click handling for the preview.
    useEffect(() => {
        const handlePreviewClick: TypedEventListener<'click'> = (e) => {
            if (isTextSelected()) {
                return;
            }

            const target = e.target as HTMLElement;
            const blockElement = target.closest('.preview-block, pre') as HTMLElement | null;

            if (blockElement && previewRef.current) {
                e.preventDefault();
                e.stopPropagation();

                syncElementWithEditor(blockElement);
            } else {
                console.error('No .preview-block or pre element found');
            }
        };

        const previewElement = previewRef.current;
        if (previewElement) {
            previewElement.removeEventListener('click', handlePreviewClick);
            previewElement.addEventListener('click', handlePreviewClick);
        }

        return () => {
            if (previewElement) {
                previewElement.removeEventListener('click', handlePreviewClick);
            }
        };
    }, [previewRef.current, syncElementWithEditor]);

    // Add event listener for RESET_EVENT.
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

            clearAllHighlightsInPreview();
        };

        document.addEventListener(RESET_EVENT, handleReset);

        return () => {
            document.removeEventListener(RESET_EVENT, handleReset);
            clearTimeoutSafe(debounceTimerRef);
        };
    }, [clearAllHighlightsInPreview]);

    // Add global handleBlockClick to window for external access.
    useEffect(() => {
        (window as any).handleBlockClick = handleBlockClick;

        return () => {
            delete (window as any).handleBlockClick;
        };
    }, [handleBlockClick]);

    // Parse formatted content when it changes.
    useEffect(() => {
        if (formattedContent) {
            parseFormattedContent(formattedContent);

            const timerId = setTimeout(() => {
                document.querySelectorAll('.preview-block, pre').forEach((block, index) => {
                    block.setAttribute('data-line-index', index.toString());
                    block.setAttribute('data-source-line', (index + 1).toString());
                    block.id = `formatted-line-${index}`;
                });
            }, MEDIUM_TIMEOUT);

            // Update cursor position after content changes.
            setTimeout(() => {
                handleCursorPositionChanged(currentCursorPositionRef.current);
            }, MEDIUM_TIMEOUT);

            return () => {
                window.clearTimeout(timerId);
            };
        }

        return undefined;
    }, [formattedContent, handleCursorPositionChanged, parseFormattedContent]);

    // Check cursor position at regular intervals.
    useEffect(() => {
        if (!editorViewRef.current) return;

        const checkCursorPosition = () => {
            if (editorViewRef.current && document.activeElement === editorViewRef.current.dom) {
                const cursorPos = editorViewRef.current.state.selection.main.head;
                const line = editorViewRef.current.state.doc.lineAt(cursorPos);
                const lineNumber = line.number;

                if (previewRef.current) {
                    const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                    const highlightedElement = previewRef.current.querySelector('.preview-block-highlight');

                    if (
                        sourceElement &&
                        (!highlightedElement || !sourceElement.classList.contains('preview-block-highlight'))
                    ) {
                        handleCursorPositionChanged(cursorPos);
                    }
                }
            }
        };

        const intervalId = setInterval(checkCursorPosition, CURSOR_CHECK_INTERVAL);

        return () => {
            clearIntervalSafe(intervalId);
        };
    }, [editorViewRef.current, previewRef.current, handleCursorPositionChanged]);

    // Track text selection globally.
    useEffect(() => {
        const handleMouseDown = (): void => {
            isSelectingRef.current = false;
        };

        const handleMouseUp = (): void => {
            // Short delay to check selection after mouseup.
            setTimeout(() => {
                isSelectingRef.current = !!window.getSelection()?.toString();
            }, SELECTION_CHECK_TIMEOUT);
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div className="relative flex h-full w-full font-sans">
            <div className="flex h-full w-1/3 flex-col border-r-2 bg-text-editor-bg">
                <EditorPanel
                    content={content}
                    onContentChange={handleContentChange}
                    onCursorChange={handleCursorPositionChanged}
                    onEditorReady={handleEditorReady}
                />
            </div>

            <div className="relative h-full w-2/3 overflow-hidden">
                <PreviewPanel
                    formattedContent={formattedContent}
                    parsedBlocks={parsedBlocks}
                    onBlockClick={handleBlockClick}
                    previewRef={previewRef as React.RefObject<HTMLDivElement>}
                />
            </div>
        </div>
    );
}
