/** Interface representing the state for the SDG Inspection module. */
export interface ISDGInspectState {
    /** The raw JSONL content from file or paste. */
    content: string;

    /** The formatted JSONL content after processing. */
    formattedContent: string;

    /** Whether the content is currently being processed. */
    isProcessing: boolean;

    /** Any error message to display. */
    error: string | null;
}
