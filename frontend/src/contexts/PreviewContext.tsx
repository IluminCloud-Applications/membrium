import { createContext, useContext } from "react";

interface PreviewContextValue {
    /** Whether the current session is in admin preview mode */
    isPreview: boolean;
}

const PreviewContext = createContext<PreviewContextValue>({ isPreview: false });

export function PreviewProvider({
    isPreview,
    children,
}: {
    isPreview: boolean;
    children: React.ReactNode;
}) {
    return (
        <PreviewContext.Provider value={{ isPreview }}>
            {children}
        </PreviewContext.Provider>
    );
}

export function usePreview() {
    return useContext(PreviewContext);
}
