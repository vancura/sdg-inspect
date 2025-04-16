import { useStore } from '@nanostores/react';
import React, { useState } from 'react';
import { $sdgStore, setFormattedContent, setProcessing } from '../stores/sdgStore.js';
import { formatJSONL } from '../utils/jsonlUtils.js';
import { Button } from './Button.js';

/** ResultActions component for the action buttons below the text editor. */
export function ResultActions(): React.ReactElement {
    // Get the content, formatted content, and processing state from the store.
    const { content, formattedContent, isProcessing } = useStore($sdgStore);

    // Set the copy and save success states.
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    /** Format the JSONL content. */
    const handleFormat = (): void => {
        // If there is no content, return.
        if (!content.trim()) return;

        // Set the processing state to true.
        try {
            setProcessing(true);

            // Format the content.
            const formatted = formatJSONL(content);

            // Set the formatted content.
            setFormattedContent(formatted);
        } catch (error) {
            alert(`Error formatting JSONL: ${String(error)}`);
        }
    };

    /** Copy formatted content to clipboard. */
    const handleCopy = async (): Promise<void> => {
        // Get the text to copy.
        const textToCopy = formattedContent || content;

        // If there is no text to copy, return.
        if (!textToCopy.trim()) return;

        // Copy the text to the clipboard.
        await navigator.clipboard.writeText(textToCopy);

        // Set the copy success state to true.
        setCopySuccess(true);

        // Reset the copy success state after a delay.
        setTimeout(() => {
            setCopySuccess(false);
        }, 2000);
    };

    /** Save the formatted content to a file. */
    const handleSave = (): void => {
        // Get the text to save.
        const textToSave = formattedContent ?? content;

        // If there is no text to save, return.
        if (!textToSave.trim()) return;

        // Create a blob from the text to save.
        const blob = new Blob([textToSave], { type: 'text/plain' });

        // Create a URL for the blob.
        const url = URL.createObjectURL(blob);

        // Create a link element.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sdg_formatted.jsonl';
        document.body.appendChild(a);
        a.click();

        // Cleanup.
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        // Set the save success state to true.
        setSaveSuccess(true);

        // Reset the success message after a delay.
        setTimeout(() => {
            setSaveSuccess(false);
        }, 2000);
    };

    return (
        <div className="mt-4 flex items-center justify-center gap-4">
            <Button
                label="Inspect SDG"
                icon="file-check-outline"
                onClick={handleFormat}
                isDisabled={!content.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
            />

            <div className="relative">
                <Button
                    label={copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                    icon={copySuccess ? 'check-circle-bold' : 'copy-outline'}
                    onClick={handleCopy}
                    isDisabled={!content.trim()}
                    className={copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}
                />
            </div>

            <div className="relative">
                <Button
                    label={saveSuccess ? 'Saved!' : 'Save File'}
                    icon={saveSuccess ? 'check-circle-bold' : 'download-square-outline'}
                    onClick={handleSave}
                    isDisabled={!content.trim()}
                    className={saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
                />
            </div>
        </div>
    );
}
