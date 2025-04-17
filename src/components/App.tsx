import React from 'react';
import { InputActions } from './InputActions.js';
import { TextEditor } from './TextEditor.js';

/** Main App component that composes the application layout. */
export function App(): React.ReactElement {
    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
            <div className="flex min-h-[80vh] flex-col items-center justify-center">
                <InputActions />
                <TextEditor />
            </div>
        </div>
    );
}
