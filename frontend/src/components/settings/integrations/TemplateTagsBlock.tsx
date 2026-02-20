import { Badge } from "@/components/ui/badge";

const TEMPLATE_VARIABLES = [
    { tag: "[[name]]", label: "Nome Completo" },
    { tag: "[[first_name]]", label: "Primeiro Nome" },
    { tag: "[[email]]", label: "Email" },
    { tag: "[[password]]", label: "Senha" },
    { tag: "[[curso]]", label: "Curso" },
    { tag: "[[link]]", label: "Link de Acesso" },
    { tag: "[[fast_link]]", label: "Acesso Rápido" },
];

interface TemplateTagsBlockProps {
    targetTextareaId: string;
}

export function TemplateTagsBlock({ targetTextareaId }: TemplateTagsBlockProps) {
    function insertTag(tag: string) {
        const textarea = document.getElementById(targetTextareaId) as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        textarea.value = value.slice(0, start) + tag + value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        textarea.focus();

        // Trigger React's onChange
        const event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);
    }

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
                Clique nas variáveis para inseri-las:
            </p>
            <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                    <Badge
                        key={v.tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => insertTag(v.tag)}
                    >
                        {v.tag}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
