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
];

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Layout</label>
            <div className="grid grid-cols-2 gap-3">
                {layouts.map((layout) => (
                    <button
                        key={layout.id}
                        type="button"
                        onClick={() => onChange(layout.id)}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                            "hover:border-primary/40 hover:bg-accent/50",
                            value === layout.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-card"
                        )}
                    >
                        <i className={cn(
                            layout.icon,
                            "text-2xl transition-colors",
                            value === layout.id ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                            "text-sm font-medium",
                            value === layout.id ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {layout.label}
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                            {layout.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
