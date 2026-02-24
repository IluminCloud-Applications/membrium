import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ColorPickerFieldProps {
    label: string;
    value: string | null;
    onChange: (color: string | null) => void;
    defaultColor: string;
}

export function ColorPickerField({ label, value, onChange, defaultColor }: ColorPickerFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const displayColor = value ?? defaultColor;

    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-8 h-8 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform shrink-0"
                    style={{ backgroundColor: displayColor }}
                />
                <input
                    ref={inputRef}
                    type="color"
                    value={displayColor}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                />
                <Input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={defaultColor}
                    className="font-mono text-xs h-8"
                />
                {value && value !== defaultColor && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(defaultColor)}
                        className="shrink-0 h-8 w-8"
                        title="Restaurar cor original"
                    >
                        <i className="ri-close-line text-xs" />
                    </Button>
                )}
            </div>
        </div>
    );
}
