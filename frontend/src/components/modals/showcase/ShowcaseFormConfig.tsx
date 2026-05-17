import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ShowcaseFormConfigProps {
    url: string;
    priority: number;
    onUrlChange: (value: string) => void;
    onPriorityChange: (value: number) => void;
}

export function ShowcaseFormConfig({
    url,
    priority,
    onUrlChange,
    onPriorityChange,
}: ShowcaseFormConfigProps) {
    return (
        <div className="space-y-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-settings-3-line" />
                Configurações
            </p>

            {/* URL */}
            <div className="space-y-2">
                <Label htmlFor="showcase-url">
                    URL de Redirecionamento <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                    <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        id="showcase-url"
                        type="url"
                        placeholder="https://exemplo.com/seu-curso"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        className="pl-9"
                        required
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    O aluno será redirecionado ao clicar no item.
                </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
                <Label htmlFor="showcase-priority">
                    Prioridade de Exibição
                </Label>
                <Input
                    id="showcase-priority"
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => onPriorityChange(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                    De 1 a 10 — quanto maior, mais destaque.
                </p>
            </div>
        </div>
    );
}
