import { map } from 'nanostores';

import type { ISDGInspectState } from '../types/index.js';

/** The initial state for the SDG inspection. */
const initialState: ISDGInspectState = {
    content: '',
    formattedContent: '',
    isProcessing: false,
    error: null
};

/** The store for SDG inspection state. */
export const $sdgStore = map<ISDGInspectState>(initialState);

/**
 * Sets the content within the store, clears any existing error, and resets the formatted content if it exists.
 *
 * @param {string} content - The content to be set.
 * @returns {void} This method does not return a value.
 */
export function setContent(content: string): void {
    $sdgStore.setKey('content', content);
    $sdgStore.setKey('error', null);

    // Reset formatted content when new content is set.
    if ($sdgStore.get().formattedContent) {
        $sdgStore.setKey('formattedContent', '');
    }
}

/**
 * Updates the store with the provided formatted content and sets the processing state to false.
 *
 * @param {string} formattedContent - The content to set in the store after it has been formatted.
 * @returns {void} This function does not return a value.
 */
export function setFormattedContent(formattedContent: string): void {
    $sdgStore.setKey('formattedContent', formattedContent);
    $sdgStore.setKey('isProcessing', false);
}

/**
 * Updates the processing status in the store.
 *
 * @param {boolean} isProcessing - A boolean value indicating the processing state to set.
 * @returns {void} This function does not return a value.
 */
export function setProcessing(isProcessing: boolean): void {
    $sdgStore.setKey('isProcessing', isProcessing);
}

/**
 * Sets the error message and updates the processing state.
 *
 * @param {string | null} error - The error message to set. If null, it clears the current error.
 * @returns {void}
 */
export function setError(error: string | null): void {
    $sdgStore.setKey('error', error);
    $sdgStore.setKey('isProcessing', false);
}

/**
 * Clears the content and resets associated states in the global store.
 *
 * This method updates the store keys related to content by resetting them to their default values. It ensures that the
 * state is properly reset and all subscribers are notified of the changes.
 *
 * @returns {void} Indicates that no value is returned from this function.
 */
export function clearContent(): void {
    $sdgStore.setKey('content', '');
    $sdgStore.setKey('formattedContent', '');
    $sdgStore.setKey('isProcessing', false);
    $sdgStore.setKey('error', null);
    $sdgStore.notify();
}
