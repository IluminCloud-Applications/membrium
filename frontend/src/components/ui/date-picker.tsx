import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    id?: string;
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    required?: boolean;
}

export function DatePicker({
    id,
    value,
    onChange,
    placeholder = "Selecione uma data",
    disabled,
    minDate,
    maxDate,
    required,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    function handleSelect(date: Date | undefined) {
        onChange(date);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    data-empty={!value}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "data-[empty=true]:text-muted-foreground"
                    )}
                >
                    <i className="ri-calendar-line text-muted-foreground" />
                    {value
                        ? format(value, "dd/MM/yyyy", { locale: ptBR })
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    defaultMonth={value || minDate || new Date()}
                    locale={ptBR}
                    required={required}
                />
            </PopoverContent>
        </Popover>
    );
}
