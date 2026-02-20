import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormAlert } from "@/components/auth/FormAlert";
import { authService } from "@/services/authService";
import type { SetupData } from "./SetupPage";

interface SetupStepAdminProps {
    data: SetupData;
    onBack: () => void;
    onComplete: (email: string, password: string) => void;
}

export function SetupStepAdmin({ data, onBack, onComplete }: SetupStepAdminProps) {
    const [email, setEmail] = useState(data.email);
    const [password, setPassword] = useState(data.password);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Informe o e-mail do administrador");
            return;
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.setup({
                platform_name: data.platform_name,
                email: email.trim(),
                password,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            onComplete(email.trim(), password);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ocorreu um erro inesperado";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <FormAlert message={error} type="error" />

            {/* Platform name badge */}
            <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2.5">
                <i className="ri-building-2-line text-primary" />
                <span className="text-muted-foreground">Plataforma:</span>
                <span className="font-medium">{data.platform_name}</span>
            </div>

            <div className="form-group">
                <Label htmlFor="setup-email" className="form-label">
                    E-mail do Administrador
                </Label>
                <div className="input-with-icon">
                    <i className="ri-mail-line input-icon" />
                    <Input
                        id="setup-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="admin@suaplataforma.com"
                        className="pl-10"
                        required
                        autoComplete="email"
                        autoFocus
                    />

                </div>
                <div className="flex items-start gap-1.5 mt-2">
                    <i className="ri-error-warning-line text-amber-500 text-sm mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        <strong>Importante:</strong> Salve este e-mail com cuidado. O administrador não
                        possui a opção "Esqueci minha senha". Este será seu único acesso de administrador.
                    </p>
                </div>
            </div>

            <PasswordInput
                id="setup-password"
                label="Senha"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                }}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
            />

            <PasswordInput
                id="setup-confirm-password"
                label="Confirmar Senha"
                value={confirmPassword}
                onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                }}
                placeholder="Repita a senha"
                autoComplete="new-password"
            />

            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 h-11"
                >
                    <i className="ri-arrow-left-line mr-1" />
                    Voltar
                </Button>
                <Button
                    type="submit"
                    className="btn-brand flex-[2] h-11"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <i className="ri-loader-4-line animate-spin" />
                            Instalando...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <i className="ri-rocket-2-line" />
                            Instalar Plataforma
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
