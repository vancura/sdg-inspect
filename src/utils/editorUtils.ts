import type { EditorView } from '@codemirror/view';
import type { RefObject } from 'react';

/**
 * Clear any active timeout safely.
 *
 * @param timerRef - Reference that holds the timer ID
 * @param timerRef.current - The timer ID
 */
export const clearTimeoutSafe = (timerRef: { current: number | null }): void => {
    if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
    }
};

/**
 * Clear any active interval safely.
 *
 * @param intervalRef - The interval ID to clear
 */
export const clearIntervalSafe = (intervalRef: ReturnType<typeof window.setInterval>): void => {
    window.clearInterval(intervalRef);
};

/**
 * Safely get element by ID with type checking.
 *
 * @param id - The ID of the element to retrieve
 * @returns The element or null if not found
 */
export const getElementByIdSafe = (id: string): HTMLElement | null => {
    return document.getElementById(id);
};

/**
 * Parse JSON safely with error handling.
 *
 * @param json - JSON string to parse
 * @param fallback - Default value to return on error
 * @returns Parsed JSON object or fallback value
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
    try {
        return JSON.parse(json);
    } catch (error) {
        // eslint-disable-next-line no-undef
        console.error('Error parsing JSON:', error);
        return fallback;
    }
};

/**
 * Scroll an element into view with smooth behavior.
 *
 * @param element - The element to scroll into view
 */
export const scrollElementIntoView = (element: Element): void => {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

/**
 * Focus the editor with an optional timeout.
 *
 * @param editorViewRef - Reference to the editor view
 * @param editorViewRef.current - The editor view
 * @param timeout - Optional timeout delay in ms
 */
export const ensureEditorFocus = (editorViewRef: { current: EditorView | null }, timeout = 0): void => {
    window.setTimeout(() => {
        if (editorViewRef.current) {
            editorViewRef.current.focus();
        }
    }, timeout);
};

/**
 * Clear all highlighting from preview blocks.
 *
 * @param previewRef - Reference to the preview container element
 */
export const clearAllHighlights = (previewRef: RefObject<HTMLDivElement>): void => {
    previewRef.current.querySelectorAll('.preview-block-highlight').forEach((el) => {
        el.classList.remove('preview-block-highlight');
    });
};
