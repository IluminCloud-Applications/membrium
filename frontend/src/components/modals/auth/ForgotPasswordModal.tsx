import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormAlert } from "@/components/auth/FormAlert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "@/hooks/useForm";
import { authService } from "@/services/authService";

interface ForgotPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = "email" | "reset" | "success";

type ForgotPasswordValues = {
    email: string;
    newPassword: string;
    confirmPassword: string;
};


export function ForgotPasswordModal({
    open,
    onOpenChange,
}: ForgotPasswordModalProps) {
    const [step, setStep] = useState<Step>("email");

    const { values, isLoading, error, setError, handleChange, handleSubmit, reset } =
        useForm<ForgotPasswordValues>({
            initialValues: { email: "", newPassword: "", confirmPassword: "" },
            onSubmit: async (formValues) => {
                if (step === "email") {
                    // Validate email exists (in the original flow, this went directly to reset)
                    if (!formValues.email) {
                        throw new Error("Informe seu e-mail");
                    }
                    setStep("reset");
                    return;
                }

                if (step === "reset") {
                    if (formValues.newPassword !== formValues.confirmPassword) {
                        throw new Error("As senhas não coincidem");
                    }

                    if (formValues.newPassword.length < 6) {
                        throw new Error("A senha deve ter pelo menos 6 caracteres");
                    }

                    const response = await authService.resetPassword({
                        email: formValues.email,
                        newPassword: formValues.newPassword,
                    });

                    if (!response.success) {
                        throw new Error(response.message);
                    }

                    setStep("success");
                }
            },
        });

    const handleClose = () => {
        onOpenChange(false);
        // Reset after animation
        setTimeout(() => {
            setStep("email");
            reset();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {step === "success" ? (
                    <SuccessView onClose={handleClose} />
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <i className="ri-lock-unlock-line text-primary" />
                                {step === "email"
                                    ? "Recuperar senha"
                                    : "Definir nova senha"}
                            </DialogTitle>
                            <DialogDescription>
                                {step === "email"
                                    ? "Informe seu e-mail cadastrado para redefinir a senha."
                                    : "Crie uma nova senha segura para sua conta."}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <FormAlert message={error} type="error" />

                            {step === "email" && (
                                <div className="form-group animate-fade-in">
                                    <Label htmlFor="forgot-email" className="form-label">
                                        E-mail
                                    </Label>
                                    <Input
                                        id="forgot-email"
                                        type="email"
                                        value={values.email}
                                        onChange={handleChange("email")}
                                        placeholder="seu@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            {step === "reset" && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                        <i className="ri-mail-line text-primary" />
                                        <span>{values.email}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("email");
                                                setError(null);
                                            }}
                                            className="ml-auto auth-link text-xs"
                                        >
                                            Alterar
                                        </button>
                                    </div>

                                    <PasswordInput
                                        id="forgot-new-password"
                                        label="Nova senha"
                                        value={values.newPassword}
                                        onChange={handleChange("newPassword")}
                                        placeholder="Mínimo 6 caracteres"
                                        autoComplete="new-password"
                                    />

                                    <PasswordInput
                                        id="forgot-confirm-password"
                                        label="Confirmar senha"
                                        value={values.confirmPassword}
                                        onChange={handleChange("confirmPassword")}
                                        placeholder="Repita a nova senha"
                                        autoComplete="new-password"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="btn-brand flex-1"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <i className="ri-loader-4-line animate-spin" />
                                    ) : step === "email" ? (
                                        "Continuar"
                                    ) : (
                                        "Redefinir senha"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SuccessView({ onClose }: { onClose: () => void }) {
    return (
        <div className="text-center py-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-3xl text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Senha redefinida!</h3>
            <p className="text-sm text-muted-foreground mb-6">
                Sua senha foi alterada com sucesso. Você já pode fazer login com a nova
                senha.
            </p>
            <Button onClick={onClose} className="btn-brand w-full">
                Ir para o Login
            </Button>
        </div>
    );
}
