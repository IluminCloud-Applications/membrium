import { Badge } from "@/components/ui/badge";

const VARIABLE_LABELS: Record<string, string> = {
    "[[name]]": "Nome Completo",
    "[[first_name]]": "Primeiro Nome",
    "[[email]]": "Email",
    "[[password]]": "Senha",
    "[[curso]]": "Curso",
    "[[link]]": "Link de Acesso",
    "[[fast_link]]": "Acesso Rápido",
};

interface TemplatePreviewProps {
    text: string;
}

/**
 * Renders a template string with `[[variable]]` tags as inline badges.
 * Line breaks are preserved. Unknown variables are shown as-is.
 */
export function TemplatePreview({ text }: TemplatePreviewProps) {
    if (!text.trim()) return null;

    const lines = text.split("\n");

    return (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <i className="ri-eye-line" />
                Visualização do Template
            </h4>
            <div className="text-sm leading-relaxed space-y-0.5">
                {lines.map((line, lineIdx) => (
                    <TemplateLine key={lineIdx} line={line} />
                ))}
            </div>
        </div>
    );
}

function TemplateLine({ line }: { line: string }) {
    if (!line.trim()) return <br />;

    // Split by [[...]] keeping the delimiters
    const parts = line.split(/(\[\[[^\]]+\]\])/g);

    return (
        <p className="inline-flex flex-wrap items-center gap-0.5">
            {parts.map((part, i) => {
                const label = VARIABLE_LABELS[part];
                if (label) {
                    return (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="text-[11px] bg-primary/10 text-primary font-medium px-1.5 py-0 mx-0.5 inline-flex"
                        >
                            {label}
                        </Badge>
                    );
                }
                // Unknown [[var]] still shown as badge
                if (/^\[\[.+\]\]$/.test(part)) {
                    return (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="text-[11px] bg-muted text-muted-foreground font-medium px-1.5 py-0 mx-0.5 inline-flex"
                        >
                            {part}
                        </Badge>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
}
