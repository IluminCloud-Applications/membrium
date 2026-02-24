import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Step = "email" | "success";

type ForgotPasswordValues = {
    email: string;
};

export function ForgotPasswordModal({
    open,
    onOpenChange,
}: ForgotPasswordModalProps) {
    const [step, setStep] = useState<Step>("email");

    const { values, isLoading, error, handleChange, handleSubmit, reset } =
        useForm<ForgotPasswordValues>({
            initialValues: { email: "" },
            onSubmit: async (formValues) => {
                if (!formValues.email) {
                    throw new Error("Informe seu e-mail");
                }

                const response = await authService.forgotPassword(formValues.email);

                if (!response.success) {
                    throw new Error(response.message);
                }

                setStep("success");
            },
        });

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep("email");
            reset();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {step === "success" ? (
                    <SuccessView email={values.email} onClose={handleClose} />
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <i className="ri-lock-unlock-line text-primary" />
                                Recuperar senha
                            </DialogTitle>
                            <DialogDescription>
                                Informe seu e-mail cadastrado. Enviaremos um link para
                                você criar uma nova senha.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <FormAlert message={error} type="error" />

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
                                    ) : (
                                        "Enviar link"
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

function SuccessView({ email, onClose }: { email: string; onClose: () => void }) {
    return (
        <div className="text-center py-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-send-fill text-3xl text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">E-mail enviado!</h3>
            <p className="text-sm text-muted-foreground mb-2">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá
                um link para redefinir sua senha.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
                Verifique também a pasta de spam.
            </p>
            <Button onClick={onClose} className="btn-brand w-full">
                Entendi
            </Button>
        </div>
    );
}
