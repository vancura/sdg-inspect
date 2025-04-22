import type { EditorView } from '@codemirror/view';
import type { RefObject } from 'react';

/** Base interface for parsed blocks. */
export interface IParsedBlock {
    /** Block type - sdg or plain. */
    type: 'sdg' | 'plain';

    /** Block data - structured differently based on type. */
    data: any;

    /** Block index in the document. */
    index: number;
}

/** Interface for SDG blocks. */
export interface ISdgBlock extends IParsedBlock {
    /** Always 'sdg' for this type. */
    type: 'sdg';

    /** SDG specific data structure. */
    data: {
        /** Block identifier. */
        id: string;

        /** Array of message objects. */
        messages: Array<any>;

        /** Optional metadata. */
        metadata?: any;
    };
}

/** Interface for plain text blocks */
export interface IPlainBlock extends IParsedBlock {
    /** Always 'plain' for this type. */
    type: 'plain';

    /** String content for plain blocks. */
    data: string;
}

/** Type for editor event handlers. */
export type EditorEventHandler = (event: Event) => void;

/** Type for HTML element event listeners with proper typing. */
export type TypedEventListener<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void;

/** Editor style constants. */
export const EditorStyles = {
    /** Base font family. */
    FONT_FAMILY: '"IBM Plex Mono", monospace',

    /** Font family with !important flag. */
    FONT_FAMILY_IMPORTANT: '"IBM Plex Mono", monospace !important'
} as const;

/** Props for the EditorPanel component. */
export interface IEditorPanelProps {
    /** Current content to display in the editor. */
    content: string;

    /** Called when content changes. */
    onContentChange: (content: string) => void;

    /** Called when cursor position changes. */
    onCursorChange: (position: number) => void;

    /** Called when the editor is initialized with the editor instance. */
    onEditorReady: (editorRef: { current: EditorView | null }) => void;
}

/** Props for the PreviewPanel component. */
export interface IPreviewPanelProps {
    /** Formatted content to display. */
    formattedContent: string;

    /** Parsed blocks from the content. */
    parsedBlocks: Array<IParsedBlock>;

    /** Callback for when a block is clicked. */
    onBlockClick: (blockId: string) => void;

    /** Ref to the preview container for scrolling and highlighting. */
    previewRef: RefObject<HTMLDivElement>;
}
