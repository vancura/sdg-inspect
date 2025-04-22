import type { EditorView } from '@codemirror/view';
import { useCallback, useEffect } from 'react';

import type { EditorEventHandler } from '../types/editorTypes.js';

/** Options for the editor events hook. */
interface IEditorEventsOptions {
    /** Editor view reference. */
    editorViewRef: { current: EditorView | null };

    /** Handler for cursor position change. */
    onCursorChange: (position: number) => void;

    /** Timeout delay for event handling. */
    defaultTimeout?: number;

    /** Immediate timeout value. */
    immediateTimeout?: number;

    /** Cursor check interval in milliseconds. */
    cursorCheckInterval?: number;
}

/**
 * Hook for managing editor events.
 *
 * @param options - Editor events configuration.
 * @param options.editorViewRef - Editor view reference.
 * @param options.onCursorChange - Handler for cursor position change.
 * @param options.defaultTimeout - Timeout delay for event handling.
 * @param options.immediateTimeout - Immediate timeout value.
 * @returns Functions for setting up events.
 */
export function useEditorEvents({
    editorViewRef,
    onCursorChange,
    defaultTimeout = 5,
    immediateTimeout = 0
}: IEditorEventsOptions) {
    /**
     * Attach event listeners to the editor.
     *
     * @param eventTypes - Array of event types to listen for
     * @param timeout - Timeout to delay handling
     * @param filter - Optional filter function
     */
    const addEditorEventListeners = useCallback(
        (
            eventTypes: Array<keyof HTMLElementEventMap>,
            timeout = defaultTimeout,
            filter?: (event: Event) => boolean
        ) => {
            if (!editorViewRef.current) return () => {};

            const handleEditorEvent: EditorEventHandler = (event: Event) => {
                if (filter && !filter(event)) return;

                // Skip cursor updates for regular typing
                if (event instanceof KeyboardEvent && !isArrowKey(event) && !event.ctrlKey && !event.metaKey) {
                    return;
                }

                window.setTimeout(() => {
                    if (editorViewRef.current) {
                        const cursorPos = editorViewRef.current.state.selection.main.head;
                        onCursorChange(cursorPos);
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
        [editorViewRef.current, onCursorChange, defaultTimeout]
    );

    /**
     * Helper for checking if the event is an arrow key press.
     *
     * @param event - Keyboard event
     * @returns True if the event is an arrow key press
     */
    const isArrowKey = useCallback((event: Event): boolean => {
        return (
            event instanceof KeyboardEvent && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
        );
    }, []);

    // Set up common editor events.
    useEffect(() => {
        // Return combined cleanup function
        const cleanupFunctions = [
            // Mouse events
            addEditorEventListeners(['mouseup', 'mousedown', 'click']),

            // Focus events
            addEditorEventListeners(['focus']),

            // Arrow key events with immediate handling
            addEditorEventListeners(['keydown'], immediateTimeout, isArrowKey)
        ];

        // Return a combined cleanup function.
        return () => {
            cleanupFunctions.forEach((cleanup) => cleanup());
        };
    }, [addEditorEventListeners, immediateTimeout, isArrowKey]);

    // Return the event setup function for custom use.
    return { addEditorEventListeners, isArrowKey };
}
