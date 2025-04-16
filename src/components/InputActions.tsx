import { useStore } from '@nanostores/react';
import React, { useRef } from 'react';
import { $sdgStore, clearContent, setContent } from '../stores/sdgStore.js';
import { Button } from './Button.js';

export const RESET_EVENT = 'sdg-inspect-reset';

/**
 * InputActions component for file upload and paste functionality.
 *
 * @returns {React.ReactElement} The InputActions component.
 */
export function InputActions(): React.ReactElement {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { content, formattedContent } = useStore($sdgStore);
    const hasContent = Boolean(content.trim() ?? formattedContent.trim());

    /** Handle file upload. */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        // Get the first file from the input.
        const file = e.target.files?.[0];

        // If there is a file, read it as text and set the content.
        if (file) {
            const reader = new FileReader();

            // When the file is loaded, set the content.
            reader.onload = (event): void => {
                const content = event.target?.result as string;
                if (content) {
                    setContent(content);
                }
            };

            // Read the file as text.
            reader.readAsText(file);

            // Reset the input so the same file can be uploaded again.
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /** Trigger file input click. */
    const handleUploadClick = (): void => {
        fileInputRef.current?.click();
    };

    /** Handle paste from clipboard. */
    const handlePaste = async (): Promise<void> => {
        // Read the text from the clipboard.
        const text = await navigator.clipboard.readText();

        // If there is text, set the content.
        if (text) {
            setContent(text);
        } else {
            alert('No text found in clipboard');
        }
    };

    /** Handle pasting example.jsonl content. */
    const handlePasteTestFile = async (): Promise<void> => {
        try {
            const response = await fetch('/example.jsonl');

            if (!response.ok) {
                throw new Error(`Failed to fetch example.jsonl: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();

            if (text) {
                setContent(text);
            } else {
                alert('No content found in example.jsonl file');
            }
        } catch (error) {
            console.error('Error loading example.jsonl:', error);
            alert(`Failed to load example.jsonl: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    /** Handle clear operation. */
    const handleClear = (): void => {
        // First dispatch a reset event to notify components.
        const resetEvent = new Event(RESET_EVENT);
        document.dispatchEvent(resetEvent);

        // Then clear content in the store.
        clearContent();

        // Also clear the file input.
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="mb-4 flex items-center justify-center gap-4">
            <h1 className="mr-4 text-2xl font-light">SDG Inspect</h1>

            <Button
                label="Upload SDG"
                icon="upload-square-outline"
                onClick={handleUploadClick}
                isDisabled={hasContent}
                className={hasContent ? 'cursor-not-allowed opacity-50' : ''}
            />

            <Button
                label="Paste from Clipboard"
                icon="clipboard-outline"
                onClick={handlePaste}
                isDisabled={hasContent}
                className={hasContent ? 'cursor-not-allowed opacity-50' : ''}
            />

            <Button
                label="Paste @example.jsonl"
                icon="document-text-outline"
                onClick={handlePasteTestFile}
                isDisabled={hasContent}
                className={hasContent ? 'cursor-not-allowed opacity-50' : ''}
            />

            {hasContent && (
                <Button
                    label="Clear"
                    icon="trash-bin-trash-outline"
                    onClick={handleClear}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                />
            )}

            <input ref={fileInputRef} type="file" accept=".jsonl" className="hidden" onChange={handleFileUpload} />
        </div>
    );
}
