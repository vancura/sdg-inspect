import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLine, keymap, ViewUpdate } from '@codemirror/view';
import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $sdgStore, autoFormatContent, setContent } from '../stores/sdgStore.js';
import { escapeHtml } from '../utils/htmlUtils.js';
import { RESET_EVENT } from './InputActions.js';
import { JsonBlock, jsonBlockStyles, JsonPlainBlock, sdgStyles } from './JsonBlock.js';

// Timing constants
const IMMEDIATE_TIMEOUT = 0;
const SHORT_TIMEOUT = 5;
const MEDIUM_TIMEOUT = 50;
const LONG_TIMEOUT = 300;
const CURSOR_CHECK_INTERVAL = 500;
const SELECTION_CHECK_TIMEOUT = 10;

// Editor style constants
const FONT_FAMILY = '"IBM Plex Mono", monospace';
const FONT_FAMILY_IMPORTANT = `${FONT_FAMILY} !important`;

// Type definitions for parsed content
interface ParsedBlock {
    type: 'sdg' | 'plain';
    data: any;
    index: number;
}

interface SdgBlock extends ParsedBlock {
    type: 'sdg';
    data: {
        id: string;
        messages: Array<any>;
        metadata?: any;
    };
}

interface PlainBlock extends ParsedBlock {
    type: 'plain';
    data: string;
}

// Type for event handlers
type EditorEventHandler = (event: Event) => void;
type TypedEventListener<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void;

// noinspection FunctionNamingConventionJS
/**
 * TextEditor component with CodeMirror for editing and previewing JSONL content.
 *
 * This component displays JSONL in a full-featured code editor in the left panel, and shows a formatted preview in the
 * right panel with bidirectional highlighting.
 */
export function TextEditor(): React.ReactElement {
    const { content, formattedContent } = useStore($sdgStore);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const currentCursorPositionRef = useRef<number>(0);
    const currentLineRef = useRef<number>(1);
    const [parsedBlocks, setParsedBlocks] = useState<Array<ParsedBlock>>([]);
    const isSelectingRef = useRef(false);

    // Check if text is currently selected
    const isTextSelected = useCallback((): boolean => {
        return isSelectingRef.current || !!window.getSelection()?.toString();
    }, []);

    const ensureEditorFocus = useCallback((timeout = IMMEDIATE_TIMEOUT) => {
        setTimeout(() => {
            if (editorViewRef.current) {
                editorViewRef.current.focus();
            }
        }, timeout);
    }, []);

    // Clear any active timeout safely
    const clearTimeout = useCallback((timerRef: React.MutableRefObject<number | null>) => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Clear any active interval safely
    const clearInterval = useCallback((intervalRef: ReturnType<typeof window.setInterval>) => {
        if (intervalRef) {
            window.clearInterval(intervalRef);
        }
    }, []);

    // Safely get element by ID with type checking
    const getElementById = useCallback<(id: string) => HTMLElement | null>((id: string) => {
        const element = document.getElementById(id);
        return element;
    }, []);

    // noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        if (editorViewRef.current) {
            if (content !== editorViewRef.current.state.doc.toString()) {
                const currentPos = currentCursorPositionRef.current;

                editorViewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: editorViewRef.current.state.doc.length,
                        insert: content
                    },
                    selection: { anchor: Math.min(currentPos, content.length) }
                });

                ensureEditorFocus();
            }
        } else {
            const state = EditorState.create({
                doc: content,
                extensions: [
                    highlightActiveLine(),
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    EditorView.lineWrapping,
                    EditorView.theme({
                        '&': {
                            height: '100%',
                            fontSize: '12px',
                            lineHeight: '1.2',
                            fontFamily: FONT_FAMILY_IMPORTANT
                        },

                        '.cm-scroller': {
                            overflow: 'auto',
                            fontFamily: FONT_FAMILY_IMPORTANT
                        },

                        '&.cm-editor.cm-focused': {
                            outline: 'none'
                        },

                        '.cm-line': {
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid transparent'
                        },

                        '.cm-activeLine': {
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            borderBottomColor: 'rgba(0, 0, 0, 0.2)'
                        },

                        '.cm-content': {
                            padding: '0',
                            fontFamily: FONT_FAMILY_IMPORTANT
                        },

                        '.cm-gutters': {
                            fontFamily: FONT_FAMILY_IMPORTANT
                        }
                    }),
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        if (update.docChanged) {
                            const newContent = update.state.doc.toString();
                            handleContentChange(newContent);
                        }

                        const cursorPos = update.state.selection.main.head;
                        currentCursorPositionRef.current = cursorPos;
                        handleCursorPositionChanged(cursorPos);
                    })
                ]
            });

            editorViewRef.current = new EditorView({
                state,
                parent: editorRef.current
            });
        }

        return () => {
            if (editorViewRef.current) {
                editorViewRef.current.destroy();
                editorViewRef.current = null;
            }
        };
    }, [content, editorRef.current, ensureEditorFocus]);

    const debouncedFormatContent = useCallback(() => {
        clearTimeout(debounceTimerRef);

        debounceTimerRef.current = window.setTimeout(() => {
            if (content.trim()) {
                if (editorViewRef.current) {
                    currentCursorPositionRef.current = editorViewRef.current.state.selection.main.head;
                }

                autoFormatContent();
            }
            debounceTimerRef.current = null;
        }, LONG_TIMEOUT);
    }, [content, clearTimeout]);

    const handleContentChange = useCallback(
        (newContent: string) => {
            if (newContent !== content) {
                const lengthDiff = newContent.length - content.length;
                const cursorPos = currentCursorPositionRef.current;

                setContent(newContent);

                if (newContent.trim()) {
                    debouncedFormatContent();
                } else {
                    setTimeout(() => autoFormatContent(), IMMEDIATE_TIMEOUT);
                }

                if (editorViewRef.current) {
                    setTimeout(() => {
                        if (editorViewRef.current) {
                            const newPos =
                                lengthDiff > 0
                                    ? Math.min(cursorPos + lengthDiff, newContent.length)
                                    : Math.min(cursorPos, newContent.length);

                            editorViewRef.current.dispatch({
                                selection: { anchor: newPos }
                            });

                            ensureEditorFocus();
                        }
                    }, IMMEDIATE_TIMEOUT);
                }
            }
        },
        [content, debouncedFormatContent, ensureEditorFocus]
    );

    const clearAllHighlights = useCallback(() => {
        if (previewRef.current) {
            previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                el.classList.remove('preview-block-highlight');
            });
        }
    }, [previewRef.current]);

    // noinspection FunctionWithMultipleReturnPointsJS
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

    const scrollElementIntoView = useCallback((element: Element) => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, []);

    // noinspection FunctionWithMultipleReturnPointsJS
    const handleCursorPositionChanged = useCallback(
        (pos: number) => {
            if (!editorViewRef.current) {
                return;
            }

            const line = editorViewRef.current.state.doc.lineAt(pos);
            const lineNumber = line.number;

            currentLineRef.current = lineNumber;

            if (previewRef.current) {
                clearAllHighlights();

                const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                if (sourceElement) {
                    sourceElement.classList.add('preview-block-highlight');
                    scrollElementIntoView(sourceElement);
                }
            }
        },
        [previewRef.current, clearAllHighlights, scrollElementIntoView]
    );

    // noinspection FunctionWithMultipleReturnPointsJS
    useEffect(() => {
        if (formattedContent) {
            parseFormattedContent(formattedContent);

            const timerId = setTimeout(() => {
                document.querySelectorAll('.json-block, pre').forEach((block, index) => {
                    block.setAttribute('data-line-index', index.toString());
                    block.setAttribute('data-source-line', (index + 1).toString());
                    block.id = `formatted-line-${index}`;
                });
            }, MEDIUM_TIMEOUT);

            return () => {
                window.clearTimeout(timerId);
            };
        } else if (!formattedContent && previewRef.current) {
            setParsedBlocks([]);
            // noinspection InnerHTMLJS
            previewRef.current.innerHTML = '';
        }

        return undefined;
    }, [formattedContent]);

    // Add error handling for JSON parsing
    const safeJsonParse = useCallback(<T,>(json: string, fallback: T): T => {
        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return fallback;
        }
    }, []);

    // Parse the formatted content into structured blocks
    const parseFormattedContent = (content: string): void => {
        if (!content) {
            setParsedBlocks([]);
            return;
        }

        const blocks = content.split('\n').map((line, index): ParsedBlock => {
            try {
                const obj = safeJsonParse<any>(line, null);
                if (obj && obj.messages && Array.isArray(obj.messages)) {
                    return {
                        type: 'sdg',
                        data: obj,
                        index
                    } as SdgBlock;
                }
                return {
                    type: 'plain',
                    data: line,
                    index
                } as PlainBlock;
            } catch {
                return {
                    type: 'plain',
                    data: line,
                    index
                } as PlainBlock;
            }
        });

        setParsedBlocks(blocks);
    };

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

    // Sync an element from preview with editor position
    const syncElementWithEditor = useCallback(
        (element: HTMLElement) => {
            if (!element || !previewRef.current || isTextSelected()) {
                return;
            }

            // Clear existing highlights
            clearAllHighlights();

            // Add highlight to the element
            element.classList.add('preview-block-highlight');

            // Scroll the element into view
            scrollElementIntoView(element);

            // Get line index and sync with editor
            const lineIndex = parseInt(element.getAttribute('data-line-index') ?? '0', 10);
            if (editorViewRef.current) {
                const pos = getLineStartPosition(lineIndex);

                editorViewRef.current.dispatch({
                    selection: { anchor: pos, head: pos }
                });

                ensureEditorFocus();
                scrollEditorToLine(lineIndex + 1);
                handleCursorPositionChanged(pos);
            }
        },
        [
            previewRef.current,
            isTextSelected,
            editorViewRef.current,
            getLineStartPosition,
            scrollEditorToLine,
            handleCursorPositionChanged,
            clearAllHighlights,
            scrollElementIntoView,
            ensureEditorFocus
        ]
    );

    useEffect(() => {
        const handlePreviewClick: TypedEventListener<'click'> = (e) => {
            if (isTextSelected()) {
                return;
            }

            const target = e.target as HTMLElement;
            const blockElement = target.closest('.json-block, pre') as HTMLElement | null;

            if (blockElement && previewRef.current) {
                e.preventDefault();
                e.stopPropagation();

                syncElementWithEditor(blockElement);
            } else {
                console.error('No .json-block or pre element found');
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
    }, [previewRef.current, syncElementWithEditor, isTextSelected]);

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

            clearAllHighlights();
        };

        document.addEventListener(RESET_EVENT, handleReset);

        return () => {
            document.removeEventListener(RESET_EVENT, handleReset);
            clearTimeout(debounceTimerRef);
        };
    }, [clearAllHighlights, clearTimeout]);

    // noinspection FunctionWithMultipleReturnPointsJS
    const handleBlockClick = useCallback(
        (blockId: string) => {
            if (isTextSelected()) {
                return;
            }

            const element = getElementById(blockId);
            if (element && previewRef.current) {
                syncElementWithEditor(element);
            }
        },
        [syncElementWithEditor, isTextSelected, getElementById]
    );

    useEffect(() => {
        (window as any).handleBlockClick = handleBlockClick;

        return () => {
            delete (window as any).handleBlockClick;
        };
    }, [handleBlockClick]);

    useEffect(() => {
        if (formattedContent && editorViewRef.current) {
            setTimeout(() => {
                const cursorPos = currentCursorPositionRef.current;
                handleCursorPositionChanged(cursorPos);
            }, MEDIUM_TIMEOUT);
        }
    }, [formattedContent, handleCursorPositionChanged]);

    const addEditorEventListeners = useCallback(
        (eventTypes: Array<keyof HTMLElementEventMap>, timeout = SHORT_TIMEOUT, filter?: (event: Event) => boolean) => {
            if (!editorViewRef.current) return () => {};

            const handleEditorEvent: EditorEventHandler = (event: Event) => {
                if (filter && !filter(event)) return;

                setTimeout(() => {
                    if (editorViewRef.current) {
                        const cursorPos = editorViewRef.current.state.selection.main.head;
                        handleCursorPositionChanged(cursorPos);
                    }
                }, timeout);
            };

            const editorDom = editorViewRef.current.dom;

            eventTypes.forEach((eventType) => {
                editorDom.addEventListener(eventType, handleEditorEvent);
            });

            return () => {
                eventTypes.forEach((eventType) => {
                    editorDom.removeEventListener(eventType, handleEditorEvent);
                });
            };
        },
        [editorViewRef.current, handleCursorPositionChanged]
    );

    // Handle keyboard events
    useEffect(() => {
        return addEditorEventListeners(['keydown', 'keyup']);
    }, [addEditorEventListeners]);

    // Handle mouse events
    useEffect(() => {
        return addEditorEventListeners(['mouseup', 'mousedown', 'click']);
    }, [addEditorEventListeners]);

    // Handle focus events
    useEffect(() => {
        return addEditorEventListeners(['focus']);
    }, [addEditorEventListeners]);

    // Handle arrow keys specifically
    useEffect(() => {
        const isArrowKey = (event: Event) =>
            event instanceof KeyboardEvent && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

        return addEditorEventListeners(['keydown'], IMMEDIATE_TIMEOUT, isArrowKey);
    }, [addEditorEventListeners]);

    // Check cursor position at regular intervals
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
            clearInterval(intervalId);
        };
    }, [editorViewRef.current, previewRef.current, handleCursorPositionChanged]);

    // Add mouse event listeners to track text selection globally with proper typing
    useEffect(() => {
        const handleMouseDown = (): void => {
            isSelectingRef.current = false;
        };

        const handleMouseUp = (): void => {
            // Short delay to check selection after mouseup
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

    // noinspection NestedConditionalExpressionJS
    return (
        <div className="relative flex h-full w-full font-sans">
            <div className="flex h-full w-1/3 flex-col border-r-2 bg-text-editor-bg">
                <div
                    ref={editorRef}
                    className="flex-1 overflow-hidden font-mono text-sm text-text-editor-text"
                    style={{ fontFamily: FONT_FAMILY }}
                />
            </div>

            <div className="relative h-full w-2/3 overflow-hidden">
                {formattedContent ? (
                    <div className="json-scroller relative h-full w-full overflow-y-auto px-4" ref={previewRef}>
                        <style>{sdgStyles}</style>
                        <style>{jsonBlockStyles}</style>

                        <div className="w-full font-mono">
                            {parsedBlocks.map((block) =>
                                block.type === 'sdg' ? (
                                    <JsonBlock
                                        key={block.index}
                                        index={block.index}
                                        id={(block as SdgBlock).data.id}
                                        messages={(block as SdgBlock).data.messages}
                                        metadata={(block as SdgBlock).data.metadata}
                                        onBlockClick={handleBlockClick}
                                    />
                                ) : (
                                    <JsonPlainBlock
                                        key={block.index}
                                        index={block.index}
                                        content={escapeHtml((block as PlainBlock).data)}
                                        onBlockClick={handleBlockClick}
                                    />
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center p-4 pt-16">
                        <div className="text-secondary-text">Preview will appear here when content is entered</div>
                    </div>
                )}
            </div>
        </div>
    );
}
