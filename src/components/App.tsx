import React from 'react';
import { SdgProvider } from '../stores/SdgContext.js';
import { InputActions } from './InputActions.js';
import { TextEditor } from './TextEditor.js';

/**
 * Main application component.
 *
 * @returns {React.ReactElement} The App component.
 */
export function App(): React.ReactElement {
    return (
        <SdgProvider>
            <div className="text-text flex h-screen w-screen flex-col bg-background">
                <div className="bg-header">
                    <InputActions />
                </div>

                <div className="flex-1 overflow-hidden">
                    <TextEditor />
                </div>
            </div>
        </SdgProvider>
    );
}
