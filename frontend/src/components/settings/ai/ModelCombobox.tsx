import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { AIModel } from "@/services/ai";

interface ModelComboboxProps {
    models: AIModel[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
}

export function ModelCombobox({
    models,
    value,
    onValueChange,
    placeholder = "Selecione um modelo",
    disabled = false,
    loading = false,
}: ModelComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedModel = useMemo(
        () => models.find((m) => m.id === value),
        [models, value]
    );

    const filteredModels = useMemo(() => {
        if (!search.trim()) return models;
        const q = search.toLowerCase();
        return models.filter(
            (m) =>
                m.id.toLowerCase().includes(q) ||
                (m.name && m.name.toLowerCase().includes(q))
        );
    }, [models, search]);

    function handleSelect(modelId: string) {
        onValueChange(modelId);
        setOpen(false);
        setSearch("");
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || loading}
                    className="w-full justify-between font-normal h-9"
                >
                    <span className="truncate">
                        {loading
                            ? "Carregando modelos..."
                            : selectedModel
                                ? selectedModel.name || selectedModel.id
                                : placeholder}
                    </span>
                    <i
                        className={`ri-arrow-down-s-line ml-2 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""
                            }`}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar modelo..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-[200px]">
                        <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                            Nenhum modelo encontrado.
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredModels.map((m) => (
                                <CommandItem
                                    key={m.id}
                                    value={m.id}
                                    onSelect={() => handleSelect(m.id)}
                                    className="rounded-lg"
                                >
                                    <i
                                        className={`ri-check-line mr-2 ${value === m.id ? "opacity-100" : "opacity-0"
                                            }`}
                                    />
                                    <span className="truncate">{m.name || m.id}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
