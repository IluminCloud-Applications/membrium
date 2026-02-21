import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TranscriptFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    onCreateTranscript: () => void;
    onAutoTranscript: () => void;
}

export function TranscriptFilters({
    search,
    onSearchChange,
    onCreateTranscript,
    onAutoTranscript,
}: TranscriptFiltersProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <Input
                    placeholder="Buscar transcrição por curso, módulo ou aula..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            <Button
                onClick={onAutoTranscript}
                variant="outline"
                className="h-9 text-sm gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
            >
                <i className="ri-robot-2-line" />
                Transcrição Automática
            </Button>

            <Button
                onClick={onCreateTranscript}
                className="btn-brand h-9 text-sm"
            >
                <i className="ri-add-line mr-1" />
                Nova Transcrição
            </Button>
        </div>
    );
}
