import { useStore } from '@nanostores/react';
import React, { useRef } from 'react';
import { $sdgStore, autoFormatContent, clearContent, setContent } from '../stores/sdgStore.js';
import { Button } from './Button.js';

export const RESET_EVENT = 'sdg-inspect-reset';

/**
 * InputActions component for file upload functionality, and pasting example content.
 *
 * @returns {React.ReactElement} The InputActions component.
 */
export function InputActions(): React.ReactElement {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { content, formattedContent } = useStore($sdgStore);
    const hasContent = Boolean(content.trim() ?? formattedContent.trim());

    /**
     * Handle file upload.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
     * @returns {void}
     */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (event): void => {
                const content = event.target?.result as string;

                if (content) {
                    setContent(content);
                    autoFormatContent();
                }
            };

            reader.readAsText(file);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /**
     * Trigger file input click.
     *
     * @returns {void}
     */
    const handleUploadClick = (): void => {
        fileInputRef.current?.click();
    };

    /**
     * Handle pasting example.jsonl content.
     *
     * @returns {Promise<void>} This method returns a promise.
     */
    const handlePasteTestFile = async (): Promise<void> => {
        try {
            const response = await fetch('/example.jsonl');

            if (!response.ok) {
                throw new Error(`Failed to fetch example.jsonl: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();

            if (text) {
                setContent(text);
                autoFormatContent();
            } else {
                alert('No content found in example.jsonl file');
            }
        } catch (error) {
            console.error('Error loading example.jsonl:', error);
            alert(`Failed to load example.jsonl: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    /**
     * Handle clear operation.
     *
     * @returns {void}
     */
    const handleClear = (): void => {
        const resetEvent = new Event(RESET_EVENT);
        document.dispatchEvent(resetEvent);

        clearContent();

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex w-full items-center border-b border-gray-200 px-4 py-2">
            <h1 className="mr-auto text-2xl">SDG Inspect</h1>

            <div className="flex items-center gap-2">
                <Button
                    label="Upload"
                    icon="upload-square-outline"
                    onClick={handleUploadClick}
                    isDisabled={hasContent}
                    className={hasContent ? 'cursor-not-allowed opacity-50' : ''}
                />

                <Button
                    label="Example"
                    icon="document-text-outline"
                    onClick={handlePasteTestFile}
                    isDisabled={hasContent}
                    className={hasContent ? 'cursor-not-allowed opacity-50' : ''}
                />

                <Button
                    label=""
                    icon="trash-bin-trash-outline"
                    onClick={handleClear}
                    isDisabled={!hasContent}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                />
            </div>

            <input ref={fileInputRef} type="file" accept=".jsonl" className="hidden" onChange={handleFileUpload} />
        </div>
    );
}
