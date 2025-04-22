import React from 'react';
import type { IPlainBlock, IPreviewPanelProps, ISdgBlock } from '../types/editorTypes.js';
import { escapeHtml } from '../utils/htmlUtils.js';
import { PreviewBlock, PreviewPlainBlock, previewBlockStyles, sdgStyles } from './PreviewBlock.js';

/**
 * PreviewPanel component for displaying formatted JSONL content.
 *
 * Renders SDG blocks and plain text blocks in a scrollable container.
 */
export function PreviewPanel({
    formattedContent,
    parsedBlocks,
    onBlockClick,
    previewRef
}: Readonly<IPreviewPanelProps>): React.ReactElement {
    // Show empty state when no content is available
    if (!formattedContent) {
        return (
            <div className="flex h-full items-center justify-center p-4 pt-16">
                <div className="text-secondary-text">Preview will appear here when content is entered</div>
            </div>
        );
    }

    return (
        <div className="preview-scroller relative h-full w-full overflow-y-auto px-4" ref={previewRef}>
            <style>{sdgStyles}</style>
            <style>{previewBlockStyles}</style>

            <div className="w-full font-mono">
                {parsedBlocks.map((block) =>
                    block.type === 'sdg' ? (
                        <PreviewBlock
                            key={block.index}
                            index={block.index}
                            id={(block as ISdgBlock).data.id}
                            messages={(block as ISdgBlock).data.messages}
                            metadata={(block as ISdgBlock).data.metadata}
                            onBlockClick={onBlockClick}
                        />
                    ) : (
                        <PreviewPlainBlock
                            key={block.index}
                            index={block.index}
                            content={escapeHtml((block as IPlainBlock).data)}
                            onBlockClick={onBlockClick}
                        />
                    )
                )}
            </div>
        </div>
    );
}
