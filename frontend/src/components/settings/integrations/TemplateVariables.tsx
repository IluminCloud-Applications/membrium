import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TemplateVariable {
    tag: string;
    label: string;
    description: string;
    /** If set, this variable only appears for this format */
    format?: "email" | "whatsapp";
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
    { tag: "[[name]]", label: "Nome Completo", description: "Nome completo do aluno" },
    { tag: "[[first_name]]", label: "Primeiro Nome", description: "Primeiro nome do aluno" },
    { tag: "[[email]]", label: "Email", description: "Email do aluno" },
    { tag: "[[password]]", label: "Senha", description: "Senha criada para o aluno" },
    { tag: "[[curso]]", label: "Curso", description: "Nome do curso matriculado" },
    { tag: "[[link]]", label: "Link de Acesso", description: "Link de acesso ao curso" },
    { tag: "[[fast_link]]", label: "Acesso Rápido", description: "Link de acesso rápido (sem email/senha)" },
    { tag: "[[unsubscribe_link]]", label: "Descadastrar", description: "Link para o aluno sair da lista de emails", format: "email" },
];

const VARIABLE_LABELS: Record<string, string> = Object.fromEntries(
    TEMPLATE_VARIABLES.map((v) => [v.tag, v.label])
);

/* ─── Clickable variable badges ──────────────────────────────── */

interface TemplateVariableBadgesProps {
    onInsert: (tag: string) => void;
    format?: "email" | "whatsapp";
}

export function TemplateVariableBadges({ onInsert, format }: TemplateVariableBadgesProps) {
    const filteredVars = TEMPLATE_VARIABLES.filter(
        (v) => !v.format || v.format === format
    );
    return (
        <TooltipProvider>
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                    Clique nas variáveis para inseri-las:
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {filteredVars.map((v) => (
                        <Tooltip key={v.tag}>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                    onClick={() => onInsert(v.tag)}
                                >
                                    {v.tag}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                <strong>{v.label}</strong> — {v.description}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}

/* ─── Template preview with badges ───────────────────────────── */

interface TemplatePreviewProps {
    text: string;
    format?: "email" | "whatsapp";
}

export function TemplatePreview({ text, format = "email" }: TemplatePreviewProps) {
    if (!text.trim()) return null;

    const lines = text.split("\n");

    return (
        <div className="text-sm leading-snug" style={{ whiteSpace: "pre-wrap" }}>
            {lines.map((line, i) => (
                <span key={i}>
                    <TemplateLine line={line} format={format} />
                    {i < lines.length - 1 && "\n"}
                </span>
            ))}
        </div>
    );
}

function TemplateLine({ line, format }: { line: string; format: "email" | "whatsapp" }) {
    if (!line.trim()) return null;

    let processed = line;

    // WhatsApp formatting: *bold* and _italic_
    if (format === "whatsapp") {
        const parts: React.ReactNode[] = [];
        // Split by *text* and _text_ patterns, also handle [[vars]]
        const regex = /(\*[^*]+\*|_[^_]+_|\[\[[^\]]+\]\])/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(processed)) !== null) {
            if (match.index > lastIndex) {
                parts.push(processed.slice(lastIndex, match.index));
            }
            const segment = match[0];
            if (segment.startsWith("*") && segment.endsWith("*")) {
                parts.push(
                    <strong key={match.index}>{renderInlineVars(segment.slice(1, -1))}</strong>
                );
            } else if (segment.startsWith("_") && segment.endsWith("_")) {
                parts.push(
                    <em key={match.index}>{renderInlineVars(segment.slice(1, -1))}</em>
                );
            } else {
                // It's a variable
                const label = VARIABLE_LABELS[segment];
                parts.push(
                    <Badge
                        key={match.index}
                        variant="secondary"
                        className="text-[11px] bg-primary/10 text-primary font-medium px-1.5 py-0 mx-0.5 inline-flex"
                    >
                        {label || segment}
                    </Badge>
                );
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < processed.length) {
            parts.push(processed.slice(lastIndex));
        }

        return <p className="inline-flex flex-wrap items-center gap-0.5">{parts}</p>;
    }

    // Email format: just replace [[vars]]
    const varParts = processed.split(/(\[\[[^\]]+\]\])/g);
    return (
        <p className="inline-flex flex-wrap items-center gap-0.5">
            {varParts.map((part, i) => {
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

function renderInlineVars(text: string): React.ReactNode[] {
    const parts = text.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, i) => {
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
        return <span key={i}>{part}</span>;
    });
}
