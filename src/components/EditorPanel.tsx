import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLine, keymap, ViewUpdate } from '@codemirror/view';
import React, { useEffect, useRef } from 'react';
import type { IEditorPanelProps } from '../types/editorTypes.js';
import { EditorStyles } from '../types/editorTypes.js';

// noinspection FunctionNamingConventionJS
/**
 * EditorPanel component for CodeMirror text editing.
 *
 * Handles the setup and lifecycle of the CodeMirror editor instance.
 */
export function EditorPanel({
    content,
    onContentChange,
    onCursorChange,
    onEditorReady
}: Readonly<IEditorPanelProps>): React.ReactElement {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorViewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        if (editorViewRef.current) {
            if (content !== editorViewRef.current.state.doc.toString()) {
                // Update existing editor content if different from props.
                editorViewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: editorViewRef.current.state.doc.length,
                        insert: content
                    }
                });
            }
        } else {
            // Initialize new editor.
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
                            fontFamily: EditorStyles.FONT_FAMILY_IMPORTANT
                        },

                        '.cm-scroller': {
                            overflow: 'auto',
                            fontFamily: EditorStyles.FONT_FAMILY_IMPORTANT
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
                            fontFamily: EditorStyles.FONT_FAMILY_IMPORTANT
                        },

                        '.cm-gutters': {
                            fontFamily: EditorStyles.FONT_FAMILY_IMPORTANT
                        }
                    }),
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        // Handle content changes.
                        if (update.docChanged) {
                            const newContent = update.state.doc.toString();
                            onContentChange(newContent);
                        }

                        // Handle cursor position changes.
                        const cursorPos = update.state.selection.main.head;
                        onCursorChange(cursorPos);
                    })
                ]
            });

            editorViewRef.current = new EditorView({
                state,
                parent: editorRef.current
            });

            // Notify parent that editor is ready.
            onEditorReady(editorViewRef);
        }

        return () => {
            if (editorViewRef.current) {
                editorViewRef.current.destroy();
                editorViewRef.current = null;
            }
        };
    }, [content, onContentChange, onCursorChange, onEditorReady]);

    return (
        <div
            ref={editorRef}
            className="flex-1 overflow-hidden font-mono text-sm text-text-editor-text"
            style={{ fontFamily: EditorStyles.FONT_FAMILY }}
        />
    );
}
