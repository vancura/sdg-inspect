import { useCallback, useState } from 'react';

import type { IParsedBlock, IPlainBlock, ISdgBlock } from '../types/editorTypes.js';
import { safeJsonParse } from '../utils/editorUtils.js';

/**
 * Custom hook for parsing formatted content into structured blocks.
 *
 * @returns Object containing parsed blocks and parsing function
 */
export function useContentParser() {
    const [parsedBlocks, setParsedBlocks] = useState<Array<IParsedBlock>>([]);

    /**
     * Parse the formatted content into structured blocks.
     *
     * @param content - Formatted content to parse
     */
    const parseFormattedContent = useCallback((content: string): void => {
        if (!content) {
            setParsedBlocks([]);
            return;
        }

        const blocks = content.split('\n').map((line, index): IParsedBlock => {
            try {
                const obj = safeJsonParse<any>(line, null);
                if (obj && obj.messages && Array.isArray(obj.messages)) {
                    return {
                        type: 'sdg',
                        data: obj,
                        index
                    } as ISdgBlock;
                }
                return {
                    type: 'plain',
                    data: line,
                    index
                } as IPlainBlock;
            } catch {
                return {
                    type: 'plain',
                    data: line,
                    index
                } as IPlainBlock;
            }
        });

        setParsedBlocks(blocks);
    }, []);

    return { parsedBlocks, parseFormattedContent };
}
