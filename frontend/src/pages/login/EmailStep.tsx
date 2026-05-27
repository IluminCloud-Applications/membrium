import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/auth/FormAlert";

interface EmailStepProps {
    email: string;
    onChangeEmail: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    error: string | null;
    isLoading: boolean;
}

export function EmailStep({
    email,
    onChangeEmail,
    onSubmit,
    error,
    isLoading,
}: EmailStepProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-5 animate-fade-in">
            {error && <FormAlert message={error} type="error" />}

            <div className="form-group">
                <Label htmlFor="login-email" className="form-label">
                    E-mail
                </Label>
                <div className="input-with-icon">
                    <i className="ri-mail-line input-icon" />
                    <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => onChangeEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        autoComplete="email"
                        autoFocus
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="btn-brand w-full h-11"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <i className="ri-loader-4-line animate-spin" />
                        Verificando...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        Continuar
                        <i className="ri-arrow-right-line" />
                    </span>
                )}
            </Button>
        </form>
    );
}
