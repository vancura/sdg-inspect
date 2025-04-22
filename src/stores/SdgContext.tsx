import React from 'react';

import type { ISDGInspectState } from '../types/index.js';
import { formatJSONL } from '../utils/jsonlUtils.js';

/** The initial state for the SDG inspection. */
const initialState: ISDGInspectState = {
    content: '',
    formattedContent: '',
    isProcessing: false,
    error: null
};

interface ISdgContextValue extends ISDGInspectState {
    setContent: (content: string) => void;
    autoFormatContent: (cursorPosition?: number) => void;
    setError: (error: string | null) => void;
    clearContent: () => void;
}

const SdgContext = React.createContext<ISdgContextValue | null>(null);

export function SdgProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [state, setState] = React.useState<ISDGInspectState>(initialState);

    const setContent = React.useCallback((content: string): void => {
        setState((prev) => ({
            ...prev,
            content,
            error: null
        }));
    }, []);

    const autoFormatContent = React.useCallback((cursorPosition?: number): void => {
        setState((prev) => {
            if (!prev.content.trim() || prev.isProcessing) {
                return prev;
            }

            try {
                const formatted = formatJSONL(prev.content);
                return {
                    ...prev,
                    formattedContent: formatted,
                    isProcessing: false,
                    ...(cursorPosition !== undefined ? { cursorPosition } : {})
                };
            } catch (error) {
                return {
                    ...prev,
                    error: String(error),
                    isProcessing: false
                };
            }
        });
    }, []);

    const setError = React.useCallback((error: string | null): void => {
        setState((prev) => ({
            ...prev,
            error,
            isProcessing: false
        }));
    }, []);

    const clearContent = React.useCallback((): void => {
        setState(initialState);
    }, []);

    const value = {
        ...state,
        setContent,
        autoFormatContent,
        setError,
        clearContent
    };

    return <SdgContext.Provider value={value}>{children}</SdgContext.Provider>;
}

export function useSdg(): ISdgContextValue {
    const context = React.useContext(SdgContext);
    if (!context) {
        throw new Error('useSdg must be used within a SdgProvider');
    }
    return context;
}
