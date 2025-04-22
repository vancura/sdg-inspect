import React from 'react';
import { InputActions } from './InputActions.js';
import { TextEditor } from './TextEditor.js';

// noinspection FunctionNamingConventionJS
/** Main App component that composes the application layout. */
export function App(): React.ReactElement {
    return (
        <div className="flex h-screen w-screen flex-col">
            <div className="flex items-center justify-between">
                <InputActions />
            </div>

            <div className="flex-1 overflow-hidden">
                <TextEditor />
            </div>
        </div>
    );
}
