import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormAlert } from "@/components/auth/FormAlert";
import { useForm } from "@/hooks/useForm";
import { authService } from "@/services/authService";
import { EmailStep } from "./EmailStep";
import { OptionsStep } from "./OptionsStep";
import { SuccessStep } from "./SuccessStep";

interface LoginFormProps {
    onForgotPassword: () => void;
    quickAccessEnabled?: boolean;
}

type LoginFormValues = {
    email: string;
    password: string;
};

export function LoginForm({ onForgotPassword, quickAccessEnabled = false }: LoginFormProps) {
    // Always start on 'password' step — the useEffect below will promote to 'email'
    // only when quickAccessEnabled=true AND at least one integration is active.
    const [step, setStep] = useState<'email' | 'options' | 'password' | 'success'>('password');
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [sendingLink, setSendingLink] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // On mount: if quickAccessEnabled, check whether Brevo or Evolution API are active.
    // Only promote to the 'email' step if at least one integration is configured.
    useEffect(() => {
        if (!quickAccessEnabled) return;

        authService.quickAccessStatus()
            .then((data) => {
                if (data.available) {
                    setStep('email');
                }
                // If no integrations: stay on classic 'password' step silently
            })
            .catch(() => {
                // Backend unreachable — stay on password step
            });
    }, [quickAccessEnabled]);

    const { values, setValues, isLoading, error, handleChange, handleSubmit } =
        useForm<LoginFormValues>({
            initialValues: { email: "", password: "" },
            onSubmit: async (formValues) => {
                setLocalError(null);
                const response = await authService.login(formValues);

                if (!response.success) {
                    throw new Error(response.message);
                }

                // Redirect based on user type
                if (response.user?.type === "admin") {
                    window.location.href = "/admin";
                } else {
                    window.location.href = "/member";
                }
            },
        });

    function setEmail(val: string) {
        setValues((prev) => ({ ...prev, email: val }));
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!values.email.trim()) return;

        setLocalError(null);
        setCheckingEmail(true);

        try {
            const check = await authService.checkQuickAccess(values.email);
            if (check.exists) {
                if (check.has_integrations) {
                    setStep('options');
                } else {
                    // Fallback to password step since no notifications channel is active
                    setStep('password');
                }
            } else {
                setLocalError("E-mail não cadastrado. Verifique o e-mail informado.");
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setLocalError(errorMsg || "Erro ao verificar o e-mail.");
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleRequestQuickAccess = async () => {
        setLocalError(null);
        setSendingLink(true);

        try {
            const res = await authService.sendQuickAccess(values.email);
            if (res.success) {
                setSuccessMessage(res.message);
                setStep('success');
            } else {
                setLocalError(res.message || "Erro ao enviar link de acesso.");
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setLocalError(errorMsg || "Erro ao enviar link de acesso.");
        } finally {
            setSendingLink(false);
        }
    };

    const displayedError = error || localError;

    // --- STEP 1: Enter Email ---
    if (quickAccessEnabled && step === 'email') {
        return (
            <EmailStep
                email={values.email}
                onChangeEmail={setEmail}
                onSubmit={handleEmailSubmit}
                error={displayedError}
                isLoading={checkingEmail}
            />
        );
    }

    // --- STEP 2: Choose Method (Quick Access vs Password) ---
    if (quickAccessEnabled && step === 'options') {
        return (
            <OptionsStep
                email={values.email}
                onBackToEmail={() => setStep('email')}
                onRequestQuickAccess={handleRequestQuickAccess}
                onSelectPassword={() => setStep('password')}
                error={displayedError}
                isLoading={sendingLink}
            />
        );
    }

    // --- STEP 3: Success Feedback ---
    if (quickAccessEnabled && step === 'success') {
        return (
            <SuccessStep
                message={successMessage}
                onBackToPassword={() => {
                    setLocalError(null);
                    setStep('password');
                }}
            />
        );
    }

    // --- STEP 4 (Default): Password Entry ---
    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {displayedError && <FormAlert message={displayedError} type="error" />}

            <div className="form-group">
                <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="login-email" className="form-label">
                        E-mail
                    </Label>
                    {quickAccessEnabled && (
                        <button
                            type="button"
                            onClick={() => {
                                setLocalError(null);
                                setStep('email');
                            }}
                            className="text-xs text-primary hover:underline font-medium"
                        >
                            Alterar e-mail
                        </button>
                    )}
                </div>
                <div className="input-with-icon">
                    <i className="ri-mail-line input-icon" />
                    <Input
                        id="login-email"
                        type="email"
                        value={values.email}
                        onChange={handleChange("email")}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        autoComplete="email"
                        disabled={quickAccessEnabled}
                    />
                </div>
            </div>

            <PasswordInput
                id="login-password"
                label="Senha"
                value={values.password}
                onChange={handleChange("password")}
                autoComplete="current-password"
                labelRight={
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="auth-link text-xs"
                    >
                        Esqueceu a senha?
                    </button>
                }
                autoFocus={quickAccessEnabled}
            />

            <div className="space-y-3 pt-1">
                <Button
                    type="submit"
                    className="btn-brand w-full h-11"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <i className="ri-loader-4-line animate-spin" />
                            Entrando...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <i className="ri-login-box-line" />
                            Entrar
                        </span>
                    )}
                </Button>

                {quickAccessEnabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-muted-foreground hover:text-foreground text-xs"
                        onClick={() => {
                            setLocalError(null);
                            setStep('options');
                        }}
                    >
                        <i className="ri-arrow-left-line mr-1" />
                        Voltar para opções
                    </Button>
                )}
            </div>
        </form>
    );
}
