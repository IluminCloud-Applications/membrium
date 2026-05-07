import type { LoginLayout } from "@/services/customization";
import { cn } from "@/lib/utils";

interface LayoutSelectorProps {
    value: LoginLayout;
    onChange: (layout: LoginLayout) => void;
}

const layouts: { id: LoginLayout; label: string; icon: string; description: string }[] = [
    {
        id: "simple",
        label: "Simples",
        icon: "ri-layout-top-2-line",
        description: "Login centralizado na tela",
    },
    {
        id: "modern",
        label: "Moderno",
        icon: "ri-layout-column-line",
        description: "Login com imagem lateral",
    },
    {
        id: "html",
        label: "HTML Livre",
        icon: "ri-code-box-line",
        description: "Página 100% personalizada",
    },
];


export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
    return (
        <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1">
            {layouts.map((layout) => (
                <button
                    key={layout.id}
                    type="button"
                    title={layout.description}
                    onClick={() => onChange(layout.id)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                        value === layout.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <i className={cn(layout.icon, "text-sm")} />
                    {layout.label}
                </button>
            ))}
        </div>
    );
}
