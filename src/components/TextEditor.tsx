import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate, highlightActiveLine, keymap } from '@codemirror/view';
import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $sdgStore, autoFormatContent, setContent } from '../stores/sdgStore.js';
import { escapeHtml } from '../utils/htmlUtils.js';
import { RESET_EVENT } from './InputActions.js';
import { JsonBlock, JsonPlainBlock, jsonBlockStyles } from './JsonBlock.js';

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
    const [currentLine, setCurrentLine] = useState<number>(1);
    const [debugMessage, setDebugMessage] = useState<string>('');
    const [parsedBlocks, setParsedBlocks] = useState<Array<any>>([]);
    const isSelectingRef = useRef(false);

    useEffect(() => {
        if (!editorRef.current) return;

        if (!editorViewRef.current) {
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
                            fontFamily: '"IBM Plex Mono", monospace !important'
                        },

                        '.cm-gutters': {
                            fontFamily: '"IBM Plex Mono", monospace !important'
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

            const view = new EditorView({
                state,
                parent: editorRef.current
            });

            editorViewRef.current = view;
        } else if (content !== editorViewRef.current.state.doc.toString()) {
            const currentPos = currentCursorPositionRef.current;

            editorViewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: editorViewRef.current.state.doc.length,
                    insert: content
                },
                selection: { anchor: Math.min(currentPos, content.length) }
            });

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

    const debouncedFormatContent = useCallback(() => {
        if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
            if (content.trim()) {
                if (editorViewRef.current) {
                    currentCursorPositionRef.current = editorViewRef.current.state.selection.main.head;
                }

                autoFormatContent();
            }
            debounceTimerRef.current = null;
        }, 300);
    }, [content]);

    const handleContentChange = useCallback(
        (newContent: string) => {
            if (newContent !== content) {
                const lengthDiff = newContent.length - content.length;
                const cursorPos = currentCursorPositionRef.current;

                setContent(newContent);

                if (!newContent.trim()) {
                    setTimeout(() => autoFormatContent(), 0);
                } else {
                    debouncedFormatContent();
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

                            editorViewRef.current.focus();
                        }
                    }, 0);
                }
            }
        },
        [content, debouncedFormatContent]
    );

    const getLineStartPosition = useCallback((lineIndex: number): number => {
        if (!editorViewRef.current) return 0;

        try {
            const doc = editorViewRef.current.state.doc;
            const line = doc.line(lineIndex + 1);
            return line.from;
        } catch (error) {
            console.error('Error getting line start position:', error);
            return 0;
        }
    }, []);

    const clearAllHighlights = () => {
        if (previewRef.current) {
            previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                el.classList.remove('preview-block-highlight');
            });
        }
    };

    const handleCursorPositionChanged = useCallback(
        (pos: number) => {
            if (!editorViewRef.current) return;

            const line = editorViewRef.current.state.doc.lineAt(pos);
            const lineNumber = line.number;

            setCurrentLine(lineNumber);

            if (previewRef.current) {
                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                const sourceElement = previewRef.current.querySelector(`[data-source-line="${lineNumber}"]`);
                if (sourceElement) {
                    sourceElement.classList.add('preview-block-highlight');

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

    useEffect(() => {
        if (formattedContent) {
            parseFormattedContent(formattedContent);

            const timerId = setTimeout(() => {
                document.querySelectorAll('.json-block, pre').forEach((block, index) => {
                    block.setAttribute('data-line-index', index.toString());
                    block.setAttribute('data-source-line', (index + 1).toString());
                    block.id = `formatted-line-${index}`;
                });
            }, 50);

            return () => {
                clearTimeout(timerId);
            };
        } else if (!formattedContent && previewRef.current) {
            setParsedBlocks([]);
            previewRef.current.innerHTML = '';
        }
    }, [formattedContent]);

    const parseFormattedContent = (content: string) => {
        if (!content) {
            setParsedBlocks([]);
            return;
        }

        const blocks = content.split('\n').map((line, index) => {
            try {
                const obj = JSON.parse(line);
                if (obj.messages && Array.isArray(obj.messages)) {
                    return {
                        type: 'sdg',
                        data: obj,
                        index
                    };
                }
                return {
                    type: 'plain',
                    data: line,
                    index
                };
            } catch {
                return {
                    type: 'plain',
                    data: line,
                    index
                };
            }
        });

        setParsedBlocks(blocks);
    };

    const scrollEditorToLine = useCallback(
        (lineNumber: number) => {
            if (!editorViewRef.current) return;

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
                }, 5);
            } catch (error) {
                console.error('Error scrolling editor to line:', error);
            }
        },
        [editorViewRef.current]
    );

    useEffect(() => {
        const handlePreviewClick = (e: MouseEvent) => {
            if (window.getSelection()?.toString()) {
                return;
            }

            const target = e.target as HTMLElement;
            const blockElement = target.closest('.json-block, pre') as HTMLElement | null;

            if (blockElement && previewRef.current) {
                setDebugMessage(`Clicked block: ${blockElement.id}`);
                console.log('Block clicked:', blockElement.id);

                e.preventDefault();
                e.stopPropagation();

                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                blockElement.classList.add('preview-block-highlight');

                const lineIndex = parseInt(blockElement.getAttribute('data-line-index') || '0', 10);

                blockElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                if (editorViewRef.current) {
                    const pos = getLineStartPosition(lineIndex);

                    editorViewRef.current.dispatch({
                        selection: { anchor: pos, head: pos }
                    });

                    editorViewRef.current.focus();
                    scrollEditorToLine(lineIndex + 1);
                    handleCursorPositionChanged(pos);
                }
            } else {
                setDebugMessage('No .json-block or pre element found');
            }
        };

        const previewElement = previewRef.current;
        if (previewElement) {
            previewElement.removeEventListener('click', handlePreviewClick as EventListener);
            previewElement.addEventListener('click', handlePreviewClick as EventListener);

            console.log('Click handler attached to preview element');
        }

        return () => {
            if (previewElement) {
                previewElement.removeEventListener('click', handlePreviewClick as EventListener);
            }
        };
    }, [previewRef.current, getLineStartPosition, handleCursorPositionChanged, scrollEditorToLine]);

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
            if (debounceTimerRef.current) {
                window.clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleBlockClick = useCallback(
        (blockId: string) => {
            if (isSelectingRef.current || window.getSelection()?.toString()) {
                return;
            }

            const element = document.getElementById(blockId);
            if (element && previewRef.current) {
                setDebugMessage(`Block clicked via handler: ${blockId}`);

                previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
                    el.classList.remove('preview-block-highlight');
                });

                element.classList.add('preview-block-highlight');

                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                const lineIndex = parseInt(element.getAttribute('data-line-index') || '0', 10);
                if (editorViewRef.current) {
                    const pos = getLineStartPosition(lineIndex);

                    editorViewRef.current.dispatch({
                        selection: { anchor: pos, head: pos }
                    });

                    editorViewRef.current.focus();
                    scrollEditorToLine(lineIndex + 1);
                    handleCursorPositionChanged(pos);
                }
            }
        },
        [previewRef.current, getLineStartPosition, scrollEditorToLine, handleCursorPositionChanged, isSelectingRef]
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
            }, 50);
        }
    }, [formattedContent, handleCursorPositionChanged]);

    useEffect(() => {
        if (!editorViewRef.current) return;

        const handleEditorKeyEvents = () => {
            setTimeout(() => {
                if (editorViewRef.current) {
                    const cursorPos = editorViewRef.current.state.selection.main.head;
                    handleCursorPositionChanged(cursorPos);
                }
            }, 5);
        };

        const editorDom = editorViewRef.current.dom;

        editorDom.addEventListener('keydown', handleEditorKeyEvents);
        editorDom.addEventListener('keyup', handleEditorKeyEvents);

        return () => {
            editorDom.removeEventListener('keydown', handleEditorKeyEvents);
            editorDom.removeEventListener('keyup', handleEditorKeyEvents);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    useEffect(() => {
        if (!editorViewRef.current) return;

        const handleEditorMouseEvents = () => {
            setTimeout(() => {
                if (editorViewRef.current) {
                    const cursorPos = editorViewRef.current.state.selection.main.head;
                    handleCursorPositionChanged(cursorPos);
                }
            }, 5);
        };

        const editorDom = editorViewRef.current.dom;

        editorDom.addEventListener('mouseup', handleEditorMouseEvents);
        editorDom.addEventListener('mousedown', handleEditorMouseEvents);
        editorDom.addEventListener('click', handleEditorMouseEvents);

        return () => {
            editorDom.removeEventListener('mouseup', handleEditorMouseEvents);
            editorDom.removeEventListener('mousedown', handleEditorMouseEvents);
            editorDom.removeEventListener('click', handleEditorMouseEvents);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

    // noinspection FunctionWithMultipleReturnPointsJS
    useEffect(() => {
        if (!editorViewRef.current) return;

        const handleEditorFocus = () => {
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

    useEffect(() => {
        if (!editorViewRef.current) return;

        const handleArrowKeys = (event: KeyboardEvent) => {
            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowRight'
            ) {
                setTimeout(() => {
                    if (editorViewRef.current) {
                        const cursorPos = editorViewRef.current.state.selection.main.head;
                        handleCursorPositionChanged(cursorPos);
                    }
                }, 0);
            }
        };

        const editorDom = editorViewRef.current.dom;
        editorDom.addEventListener('keydown', handleArrowKeys);

        return () => {
            editorDom.removeEventListener('keydown', handleArrowKeys);
        };
    }, [editorViewRef.current, handleCursorPositionChanged]);

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

        const intervalId = setInterval(checkCursorPosition, 500);

        return () => {
            clearInterval(intervalId);
        };
    }, [editorViewRef.current, previewRef.current, handleCursorPositionChanged]);

    // Add mouse event listeners to track text selection globally
    useEffect(() => {
        const handleMouseDown = () => {
            isSelectingRef.current = false;
        };

        const handleMouseUp = () => {
            // Short delay to check selection after mouseup
            setTimeout(() => {
                if (window.getSelection()?.toString()) {
                    isSelectingRef.current = true;
                } else {
                    isSelectingRef.current = false;
                }
            }, 10);
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

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

    .json-scroller {
        overflow-y: auto;
        scroll-behavior: smooth;
        height: 100%;
    }
`;

    return (
        <div className="relative flex h-full w-full font-sans">
            <div className="bg-text-editor-bg flex h-full w-1/3 flex-col border-r-2">
                <div
                    ref={editorRef}
                    className="text-text-editor-text flex-1 overflow-hidden font-mono text-sm"
                    style={{ fontFamily: '"IBM Plex Mono", monospace' }}
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
                                        id={block.data.id}
                                        messages={block.data.messages}
                                        metadata={block.data.metadata}
                                        onBlockClick={handleBlockClick}
                                    />
                                ) : (
                                    <JsonPlainBlock
                                        key={block.index}
                                        index={block.index}
                                        content={escapeHtml(block.data)}
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
