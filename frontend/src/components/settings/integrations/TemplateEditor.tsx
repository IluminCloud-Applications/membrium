import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TemplateVariableBadges, TemplatePreview } from "./TemplateVariables";

interface TemplateEditorProps {
    /** "brevo" or "evolution" — controls preview formatting */
    format: "email" | "whatsapp";
    /** Subject line (only for email) */
    subject?: string;
    onSubjectChange?: (value: string) => void;
    /** Template body text */
    body: string;
    onBodyChange: (value: string) => void;
    /** Template mode: simple text or HTML */
    templateMode: "simple" | "html";
    onTemplateModeChange: (mode: "simple" | "html") => void;
}

export function TemplateEditor({
    format,
    subject,
    onSubjectChange,
    body,
    onBodyChange,
    templateMode,
    onTemplateModeChange,
}: TemplateEditorProps) {
    const [showPreview, setShowPreview] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleInsertTag(tag: string) {
        const el = textareaRef.current;
        if (!el) return;

        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newValue = body.slice(0, start) + tag + body.slice(end);
        onBodyChange(newValue);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + tag.length;
            el.focus();
        });
    }

    const previewText = format === "email" && subject
        ? `Assunto: ${subject}\n\n${body}`
        : body;

    return (
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <i className={format === "email" ? "ri-mail-open-line text-primary" : "ri-whatsapp-line text-primary"} />
                    {format === "email" ? "Template de Email" : "Template de Mensagem"}
                </h4>
                <div className="flex items-center gap-2">
                    {/* Template mode toggle — HTML only available for email */}
                    {format === "email" && (
                        <div className="flex rounded-lg border overflow-hidden text-xs">
                            <button
                                type="button"
                                onClick={() => onTemplateModeChange("simple")}
                                className={`px-3 py-1 transition-colors cursor-pointer ${templateMode === "simple"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                    }`}
                            >
                                Simples
                            </button>
                            <button
                                type="button"
                                onClick={() => onTemplateModeChange("html")}
                                className={`px-3 py-1 transition-colors cursor-pointer ${templateMode === "html"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                    }`}
                            >
                                HTML
                            </button>
                        </div>
                    )}

                    {/* Preview toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs gap-1 h-7"
                    >
                        <i className={showPreview ? "ri-eye-off-line" : "ri-eye-line"} />
                        {showPreview ? "Ocultar" : "Visualizar"}
                    </Button>
                </div>
            </div>

            <TemplateVariableBadges onInsert={handleInsertTag} format={format} />

            <div className={`grid gap-4 items-start ${showPreview ? "grid-cols-[1fr_0.43fr]" : "grid-cols-1"}`}>
                {/* Editor side */}
                <div className="space-y-3">
                    {format === "email" && onSubjectChange && (
                        <div className="space-y-1.5">
                            <Label>Assunto do Email</Label>
                            <Input
                                value={subject || ""}
                                onChange={(e) => onSubjectChange(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label>
                            {templateMode === "html" ? "Código HTML" : (format === "email" ? "Corpo do Email" : "Mensagem")}
                        </Label>
                        <Textarea
                            ref={textareaRef}
                            value={body}
                            onChange={(e) => onBodyChange(e.target.value)}
                            className="min-h-[200px] max-h-[600px] font-mono text-sm resize-y"
                            placeholder={
                                templateMode === "html"
                                    ? "<html>\n  <body>\n    <p>Olá [[name]]!</p>\n  </body>\n</html>"
                                    : undefined
                            }
                        />
                        {templateMode === "html" && (
                            <p className="text-xs text-muted-foreground">
                                Use as variáveis <code className="bg-muted px-1 rounded">[[name]]</code> dentro do HTML.
                                Elas serão substituídas automaticamente.
                            </p>
                        )}
                    </div>
                </div>

                {/* Preview side */}
                {showPreview && (
                    <div className="rounded-lg border bg-background p-3 overflow-auto">
                        <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                            <i className="ri-eye-line" />
                            Preview
                        </h5>
                        {templateMode === "html" ? (
                            <div
                                className="text-sm prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: replaceVariablesForHtmlPreview(body) }}
                            />
                        ) : (
                            <TemplatePreview text={previewText} format={format} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Utils ──────────────────────────────────────────────────── */

function replaceVariablesForHtmlPreview(html: string): string {
    const sampleValues: Record<string, string> = {
        "[[name]]": '<span style="color: var(--primary); font-weight: 600;">João Silva</span>',
        "[[first_name]]": '<span style="color: var(--primary); font-weight: 600;">João</span>',
        "[[email]]": '<span style="color: var(--primary); font-weight: 600;">joao@email.com</span>',
        "[[password]]": '<span style="color: var(--primary); font-weight: 600;">abc123</span>',
        "[[curso]]": '<span style="color: var(--primary); font-weight: 600;">Curso Exemplo</span>',
        "[[link]]": '<span style="color: var(--primary); font-weight: 600;">https://app.com/curso</span>',
        "[[fast_link]]": '<span style="color: var(--primary); font-weight: 600;">https://app.com/fast/xyz</span>',
        "[[unsubscribe_link]]": '<span style="color: var(--primary); font-weight: 600;">https://app.com/unsubscribe/abc</span>',
    };

    let result = html;
    for (const [key, value] of Object.entries(sampleValues)) {
        result = result.replaceAll(key, value);
    }
    return result;
}
