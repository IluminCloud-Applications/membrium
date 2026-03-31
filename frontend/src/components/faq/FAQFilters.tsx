import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FAQFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    onCreateFaq: () => void;
    onAutoFaq: () => void;
}

export function FAQFilters({
    search,
    onSearchChange,
    onCreateFaq,
    onAutoFaq,
}: FAQFiltersProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <Input
                    placeholder="Buscar FAQ por curso, módulo ou aula..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            {/* Auto FAQ button — same design as TranscriptFilters */}
            <Button
                variant="outline"
                className="h-9 text-sm gap-2"
                onClick={onAutoFaq}
            >
                <i className="ri-robot-2-line text-primary" />
                FAQ Automático
            </Button>

            <Button
                onClick={onCreateFaq}
                className="btn-brand h-9 text-sm"
            >
                <i className="ri-add-line mr-1" />
                Novo FAQ
            </Button>
        </div>
    );
}
