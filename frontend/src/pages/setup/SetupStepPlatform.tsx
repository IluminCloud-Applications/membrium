import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/auth/FormAlert";

interface SetupStepPlatformProps {
    value: string;
    onNext: (name: string) => void;
}

export function SetupStepPlatform({ value, onNext }: SetupStepPlatformProps) {
    const [name, setName] = useState(value);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (name.trim().length < 2) {
            setError("O nome da plataforma deve ter pelo menos 2 caracteres");
            return;
        }

        onNext(name.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <FormAlert message={error} type="error" />

            <div className="form-group">
                <Label htmlFor="setup-platform" className="form-label">
                    Nome da Plataforma
                </Label>
                <div className="input-with-icon">
                    <i className="ri-building-2-line input-icon" />
                    <Input
                        id="setup-platform"
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Ex: Cademi, AstronMembers..."
                        className="pl-10"
                        required
                        autoFocus
                    />
                </div>

                <p className="form-hint">
                    Este é o nome principal da sua plataforma, como <strong>Cademi</strong>,{" "}
                    <strong>AstronMembers</strong> ou <strong>Membrium</strong>. Será exibido na
                    tela de login dos seus alunos.
                </p>
            </div>

            <Button type="submit" className="btn-brand w-full h-11">
                <span className="flex items-center gap-2">
                    Continuar
                    <i className="ri-arrow-right-line" />
                </span>
            </Button>
        </form>
    );
}
