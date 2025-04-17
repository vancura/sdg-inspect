import { map } from 'nanostores';

import type { ISDGInspectState } from '../types/index.js';
import { formatJSONL } from '../utils/jsonlUtils.js';

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
 * Sets the content within the store and clears any existing error.
 *
 * @param {string} content - The content to be set.
 * @returns {void}
 */
export function setContent(content: string): void {
    $sdgStore.setKey('content', content);
    $sdgStore.setKey('error', null);
}

/**
 * Automatically formats the content in the store if it's not already processed. This is used to trigger formatting when
 * content is added without explicitly clicking the format button.
 *
 * @returns {void}
 */
export function autoFormatContent(): void {
    const { content, isProcessing } = $sdgStore.get();

    if (content.trim() && !isProcessing) {
        try {
            $sdgStore.setKey('isProcessing', true);

            const formatted = formatJSONL(content);

            $sdgStore.setKey('formattedContent', formatted);
            $sdgStore.setKey('isProcessing', false);
        } catch (error) {
            setError(String(error));
        }
    }
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
 * @returns {void}
 */
export function clearContent(): void {
    $sdgStore.setKey('content', '');
    $sdgStore.setKey('formattedContent', '');
    $sdgStore.setKey('isProcessing', false);
    $sdgStore.setKey('error', null);
    $sdgStore.notify();
}
