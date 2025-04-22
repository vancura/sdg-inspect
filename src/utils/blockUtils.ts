/**
 * Creates a block ID from an index.
 *
 * @param index - The block index
 * @returns The formatted block ID
 */
export const getBlockId = (index: number): string => `formatted-line-${index}`;

/**
 * Check if text is currently selected.
 *
 * @returns True if text is selected
 */
export const isTextSelected = (): boolean => !!window.getSelection()?.toString();

/**
 * Strips HTML tags from a string.
 *
 * @param html - The string containing HTML to strip
 * @returns The string with HTML tags removed
 */
export const stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(?:>|$)/g, '');
};

/**
 * Parses metadata string to object with error handling.
 *
 * @param metadata - Metadata string to parse
 * @returns Parsed metadata object or null on error
 */
export const parseMetadata = (metadata?: string): Record<string, any> | null => {
    if (!metadata) return null;

    try {
        return JSON.parse(metadata);
    } catch (e) {
        console.error('Failed to parse metadata:', e);
        return null;
    }
};
