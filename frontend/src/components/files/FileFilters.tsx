import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FileType, FileStatus } from "@/types/file";

interface FileFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    fileType: FileType;
    onFileTypeChange: (value: FileType) => void;
    status: FileStatus;
    onStatusChange: (value: FileStatus) => void;
    unusedCount: number;
    onCleanUnused: () => void;
}

const fileTypes: { value: FileType; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "image", label: "Imagens" },
    { value: "document", label: "Documentos" },
];

export function FileFilters({
    search,
    onSearchChange,
    fileType,
    onFileTypeChange,
    status,
    onStatusChange,
    unusedCount,
    onCleanUnused,
}: FileFiltersProps) {
    return (
        <div className="space-y-4">
            {/* Top row: Search + actions */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        placeholder="Buscar arquivo..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Status filter */}
                    <Select
                        value={status}
                        onValueChange={(v) => onStatusChange(v as FileStatus)}
                    >
                        <SelectTrigger className="w-[160px] h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all" className="rounded-lg">
                                Todos
                            </SelectItem>
                            <SelectItem value="used" className="rounded-lg">
                                Em uso
                            </SelectItem>
                            <SelectItem value="unused" className="rounded-lg">
                                Não utilizados
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clean unused */}
                    {unusedCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={onCleanUnused}
                            className="h-9 text-sm text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                            <i className="ri-delete-bin-line mr-1" />
                            Limpar ({unusedCount})
                        </Button>
                    )}
                </div>
            </div>

            {/* File type tabs */}
            <Tabs
                value={fileType}
                onValueChange={(v) => onFileTypeChange(v as FileType)}
            >
                <TabsList className="h-8">
                    {fileTypes.map((type) => (
                        <TabsTrigger
                            key={type.value}
                            value={type.value}
                            className="text-xs px-3 h-7"
                        >
                            {type.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
}
