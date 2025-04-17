/**
 * Represents a structured object for SDG messages. It contains the contents of a message and the associated role of the
 * message sender or target.
 */
interface ISDGMessage {
    /** The content of the message. */
    content?: string;

    /** The role of the message. */
    role?: string;
}

/** Interface representing the metadata for the SDG document. */
interface ISDGMetadata {
    /** The SDG document. */
    sdgDocument?: string;

    /** The domain. */
    domain?: string;

    /** The dataset. */
    dataset?: string;

    /** The raw document. */
    rawDocument?: string;

    /** The dataset type. */
    datasetType?: string;
}

/**
 * Interface representing ISDGData. This interface defines the structure for storing optional data related to SDGs. It
 * may contain messages, metadata, and an identifier.
 */
interface ISDGData {
    /** Represents an optional list of messages. */
    messages?: ISDGMessage[];

    /** The metadata. */
    metadata?: string;

    /** The ID. */
    id?: string;
}

// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Formats a JSONL (JSON Lines) string by applying a line-by-line formatting function.
 *
 * @param {string} content - The JSONL content, where each line represents a JSON object.
 * @returns {string} The formatted JSONL string, with each line properly formatted. Returns an empty string if the input
 *   is empty.
 */
export function formatJSONL(content: string): string {
    // If the content is empty, return an empty string.
    if (!content.trim()) {
        return '';
    }

    try {
        // Split by new lines and format each line.
        const lines = content.split('\n');
        const formattedLines = lines.map(formatJSONLLine);

        // Join with newlines to maintain JSONL format.
        return formattedLines.filter(Boolean).join('\n');
    } catch (error) {
        // Re-throw with a more descriptive message.
        throw new Error(`Failed to format JSONL content: ${String(error)}`);
    }
}

// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Formats a given line of JSONL text. Parses the input string into a JSON object, optionally processes it, and returns
 * the formatted JSON as a single line string. If the input line is empty or cannot be parsed, the function returns
 * either an empty string or the original line, respectively.
 *
 * @param {string} line - A single line string in JSONL format to be formatted.
 * @returns {string} The formatted JSON line as a string, or the original input if parsing fails or is invalid.
 */
function formatJSONLLine(line: string): string {
    // Skip empty lines.
    if (!line.trim()) {
        return '';
    }

    try {
        // Parse JSON object.
        const parsedLine = JSON.parse(line) as ISDGData;

        // Process SDG format if it matches the expected structure.
        if (parsedLine.messages && Array.isArray(parsedLine.messages)) {
            processSDGContent(parsedLine);
        }

        // Format with pretty JSON but keep it as a single line for JSONL validity.
        return JSON.stringify(parsedLine);
    } catch {
        // Return the original line if it can't be parsed.
        return line;
    }
}

/**
 * Processes the SDG content by updating its messages to highlight Question and Answer (Q&A) pairs and handling
 * associated metadata.
 *
 * @param {ISDGData} parsedLine - The parsed SDG data containing messages and metadata.
 * @returns {void}
 */
function processSDGContent(parsedLine: ISDGData): void {
    if (parsedLine.messages && Array.isArray(parsedLine.messages)) {
        parsedLine.messages = parsedLine.messages.map((message: ISDGMessage) => {
            const content = message.content ?? '';
            message.content = highlightQnAPairs(content);
            return message;
        });
    }

    processMetadata(parsedLine);
}

// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Processes and updates the metadata field of a parsed line object. It parses the metadata as JSON if it is a string,
 * applies formatting to specific fields, and then serializes the metadata back to a string.
 *
 * @param {ISDGData} parsedLine The input object containing a metadata field to be processed.
 * @returns {void}
 */
function processMetadata(parsedLine: ISDGData): void {
    if (!(parsedLine.metadata ?? '')) {
        return; // if metadata is not present, return
    }

    try {
        // If metadata is a JSON string, parse it.
        if (typeof parsedLine.metadata !== 'string') {
            return;
        }

        const metadata = JSON.parse(parsedLine.metadata) as ISDGMetadata;
        if (metadata.sdgDocument ?? '') {
            metadata.sdgDocument = `<span class="sdg-document">${metadata.sdgDocument}</span>`;
        }

        if (metadata.domain ?? '') {
            metadata.domain = `<span class="sdg-domain">${metadata.domain}</span>`;
        }

        parsedLine.metadata = JSON.stringify(metadata);
    } catch {
        // If we can't parse metadata as JSON, leave it as is.
    }
}

// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Highlights the QnA pairs within the given content by replacing the user and assistant markers with stylized HTML tags
 * and applying additional formatting for questions and answers.
 *
 * @param {string} content - The input string containing QnA pairs with '<|user|>' and '<|assistant|>' markers.
 * @returns {string} - The formatted string with styling applied to user, assistant, and their respective content.
 */
function highlightQnAPairs(content: string): string {
    if (!content.includes('<|user|>') && !content.includes('<|assistant|>')) {
        return content;
    }

    let formattedContent = content
        .replace(/<\|user\|>/g, '<span class="sdg-user-tag">&lt;|user|&gt;</span>')
        .replace(/<\|assistant\|>/g, '<span class="sdg-assistant-tag">&lt;|assistant|&gt;</span>');

    formattedContent = applyQuestionFormatting(formattedContent);
    formattedContent = applyAnswerFormatting(formattedContent);

    return formattedContent;
}

/**
 * Applies specific formatting to content by wrapping user input sections with a custom tag. This method identifies
 * segments of the content marked as user input and formats them accordingly.
 *
 * @param {string} content - The string containing the content to format, which may include specific user and assistant
 *   tags.
 * @returns {string} - The formatted content with user segments wrapped in a designated div tag.
 */
function applyQuestionFormatting(content: string): string {
    const userRegex =
        /<span class="sdg-user-tag">&lt;\|user\|&gt;<\/span>([\S\s]*?)(?=<span class="sdg-assistant-tag">|$)/g;

    return content.replace(userRegex, (match, p1: string) => {
        return match.replace(p1, `\n<div class="sdg-question">${p1.trim()}</div>\n`);
    });
}

/**
 * Formats the provided content by identifying and transforming specific segments marked with an assistant tag into
 * structured div elements.
 *
 * @param {string} content - The string content to be formatted. This content should include segments marked with
 *   assistant tags.
 * @returns {string} - The formatted string content where the parts marked with assistant tags are replaced with
 *   structured div elements.
 */
function applyAnswerFormatting(content: string): string {
    const assistantRegex =
        /<span class="sdg-assistant-tag">&lt;\|assistant\|&gt;<\/span>([\S\s]*?)(?=<span class="sdg-user-tag">|$)/g;

    return content.replace(assistantRegex, (match, p1: string) => {
        return match.replace(p1, `\n<div class="sdg-answer">${p1.trim()}</div>\n`);
    });
}
