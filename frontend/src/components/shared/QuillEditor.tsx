import { useEffect, useRef, forwardRef, useLayoutEffect } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
    defaultValue?: string;
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

/**
 * Uncontrolled Quill editor wrapped for React.
 * Outputs HTML string through onChange.
 */
const QuillEditor = forwardRef<Quill | null, QuillEditorProps>(
    ({ defaultValue, value, onChange, placeholder, readOnly = false }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const onChangeRef = useRef(onChange);
        const internalRef = useRef<Quill | null>(null);
        const isInitializedRef = useRef(false);

        useLayoutEffect(() => {
            onChangeRef.current = onChange;
        });

        useEffect(() => {
            if (ref && typeof ref === "object") {
                (ref as React.MutableRefObject<Quill | null>).current?.enable(!readOnly);
            }
            internalRef.current?.enable(!readOnly);
        }, [ref, readOnly]);

        useEffect(() => {
            const container = containerRef.current;
            if (!container || isInitializedRef.current) return;

            const editorContainer = container.appendChild(
                container.ownerDocument.createElement("div")
            );

            const quill = new Quill(editorContainer, {
                theme: "snow",
                placeholder: placeholder ?? "Digite aqui...",
                modules: {
                    toolbar: [
                        ["bold", "italic", "underline"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"],
                    ],
                },
            });

            internalRef.current = quill;
            isInitializedRef.current = true;

            if (ref && typeof ref === "object") {
                (ref as React.MutableRefObject<Quill | null>).current = quill;
            }

            // Set initial content
            if (defaultValue || value) {
                const content = defaultValue || value || "";
                if (content.startsWith("<")) {
                    const delta = quill.clipboard.convert({ html: content });
                    quill.setContents(delta);
                } else {
                    quill.setText(content);
                }
            }

            quill.on("text-change", () => {
                const html = quill.root.innerHTML;
                onChangeRef.current?.(html === "<p><br></p>" ? "" : html);
            });

            return () => {
                internalRef.current = null;
                isInitializedRef.current = false;
                if (ref && typeof ref === "object") {
                    (ref as React.MutableRefObject<Quill | null>).current = null;
                }
                container.innerHTML = "";
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return (
            <div
                ref={containerRef}
                className="quill-editor-container relative rounded-lg border border-input [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-input [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:border-0 [&_.ql-container]:min-h-[120px] [&_.ql-container]:max-h-[200px] [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-tooltip]:left-0! [&_.ql-tooltip]:right-auto [&_.ql-tooltip]:w-full [&_.ql-tooltip]:z-50"
            />
        );
    }
);

QuillEditor.displayName = "QuillEditor";

export { QuillEditor };
