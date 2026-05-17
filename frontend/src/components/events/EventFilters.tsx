import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type EventSortOption = "newest" | "oldest" | "name";

interface EventFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    sortBy: EventSortOption;
    onSortChange: (value: EventSortOption) => void;
    onCreateItem: () => void;
}

export function EventFilters({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    sortBy,
    onSortChange,
    onCreateItem,
}: EventFiltersProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <Input
                    placeholder="Buscar eventos..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">
                        Todos
                    </SelectItem>
                    <SelectItem value="active" className="rounded-lg">
                        Ativos
                    </SelectItem>
                    <SelectItem value="inactive" className="rounded-lg">
                        Inativos
                    </SelectItem>
                    <SelectItem value="upcoming" className="rounded-lg">
                        Programados
                    </SelectItem>
                    <SelectItem value="expired" className="rounded-lg">
                        Expirados
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as EventSortOption)}>
                <SelectTrigger className="w-[170px] h-9">
                    <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="newest" className="rounded-lg">
                        Mais recentes
                    </SelectItem>
                    <SelectItem value="oldest" className="rounded-lg">
                        Mais antigos
                    </SelectItem>
                    <SelectItem value="name" className="rounded-lg">
                        Nome A-Z
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Create action */}
            <Button onClick={onCreateItem} className="btn-brand h-9 text-sm">
                <i className="ri-add-line mr-1" />
                Novo Evento
            </Button>
        </div>
    );
}
