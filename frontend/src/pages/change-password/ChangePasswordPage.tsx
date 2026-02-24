import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormAlert } from "@/components/auth/FormAlert";
import { authService } from "@/services/authService";

type PageState = "form" | "success" | "error";

export function ChangePasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const uuid = searchParams.get("id") || "";

    const [state, setState] = useState<PageState>(uuid ? "form" : "error");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setLoading(true);
        try {
            const res = await authService.changePassword({
                uuid,
                newPassword: password,
            });

            if (res.success) {
                setState("success");
            } else {
                setError(res.message);
            }
        } catch {
            setError("Erro ao alterar senha. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    if (state === "error") {
        return <InvalidTokenView onGoToLogin={() => navigate("/login")} />;
    }

    if (state === "success") {
        return <SuccessView onGoToLogin={() => navigate("/login")} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="bg-card border rounded-xl shadow-lg p-8 animate-fade-in">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-lock-password-line text-2xl text-primary" />
                        </div>
                        <h1 className="text-xl font-bold">Nova senha</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Crie uma nova senha segura para sua conta.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormAlert message={error} type="error" />

                        <PasswordInput
                            id="new-password"
                            label="Nova senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                        />

                        <PasswordInput
                            id="confirm-password"
                            label="Confirmar senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            autoComplete="new-password"
                        />

                        <Button
                            type="submit"
                            className="btn-brand w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <i className="ri-loader-4-line animate-spin mr-2" />
                            ) : (
                                <i className="ri-check-line mr-2" />
                            )}
                            {loading ? "Alterando..." : "Alterar senha"}
                        </Button>
                    </form>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <i className="ri-arrow-left-line mr-1" />
                            Voltar ao login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuccessView({ onGoToLogin }: { onGoToLogin: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="bg-card border rounded-xl shadow-lg p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <i className="ri-checkbox-circle-fill text-3xl text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Senha alterada!</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Sua senha foi alterada com sucesso. Você já pode fazer login
                        com a nova senha.
                    </p>
                    <Button onClick={onGoToLogin} className="btn-brand w-full">
                        Ir para o Login
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InvalidTokenView({ onGoToLogin }: { onGoToLogin: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="bg-card border rounded-xl shadow-lg p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <i className="ri-error-warning-fill text-3xl text-destructive" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Link inválido</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        O link de recuperação de senha é inválido ou expirou.
                        Solicite um novo link na página de login.
                    </p>
                    <Button onClick={onGoToLogin} className="btn-brand w-full">
                        Ir para o Login
                    </Button>
                </div>
            </div>
        </div>
    );
}
