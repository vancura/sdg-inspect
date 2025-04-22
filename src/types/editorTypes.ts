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

/** Editor timing constants. */
export const EditorTimings = {
    /** Immediate execution (0ms). */
    IMMEDIATE: 0,

    /** Short delay (5ms). */
    SHORT: 5,

    /** Medium delay (50ms). */
    MEDIUM: 50,

    /** Long delay (300ms). */
    LONG: 300,

    /** Cursor position check interval (500ms). */
    CURSOR_CHECK_INTERVAL: 500,

    /** Selection check timeout (10ms). */
    SELECTION_CHECK: 10
} as const;

/** Editor style constants. */
export const EditorStyles = {
    /** Base font family. */
    FONT_FAMILY: '"IBM Plex Mono", monospace',

    /** Font family with !important flag. */
    FONT_FAMILY_IMPORTANT: '"IBM Plex Mono", monospace !important'
} as const;
