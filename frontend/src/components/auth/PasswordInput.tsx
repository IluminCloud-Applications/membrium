import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type ReactNode } from "react";

interface PasswordInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
    labelRight?: ReactNode;
}

export function PasswordInput({
    id,
    label,
    value,
    onChange,
    placeholder = "••••••••",
    required = true,
    autoComplete = "current-password",
    labelRight,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-group">
            <div className="flex items-center justify-between">
                <Label htmlFor={id} className="form-label">
                    {label}
                </Label>
                {labelRight}
            </div>
            <div className="relative">
                <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none" />
                <Input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                    className="pl-10 pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                    <i
                        className={
                            showPassword ? "ri-eye-off-line text-lg" : "ri-eye-line text-lg"
                        }
                    />
                </button>
            </div>
        </div>
    );
}
