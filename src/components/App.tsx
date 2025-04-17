import React from 'react';
import { InputActions } from './InputActions.js';
import { TextEditor } from './TextEditor.js';

/** Main App component that composes the application layout. */
export function App(): React.ReactElement {
    return (
        <div className="flex h-screen w-screen flex-col">
            <div className="bg-fuchsia-500 px-4 py-2 text-white">
                <div className="mx-auto max-w-full">TOOLBAR</div>
            </div>

            <div className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <InputActions />
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <TextEditor />
            </div>
        </div>
    );
}
