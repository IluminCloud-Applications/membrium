import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/FormAlert";

interface OptionsStepProps {
    email: string;
    onBackToEmail: () => void;
    onRequestQuickAccess: () => void;
    onSelectPassword: () => void;
    error: string | null;
    isLoading: boolean;
}

export function OptionsStep({
    email,
    onBackToEmail,
    onRequestQuickAccess,
    onSelectPassword,
    error,
    isLoading,
}: OptionsStepProps) {
    return (
        <div className="space-y-5 animate-fade-in">
            {error && <FormAlert message={error} type="error" />}

            <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/40 mb-2">
                <p className="text-xs text-muted-foreground">Entrar como</p>
                <p className="text-sm font-medium text-foreground truncate max-w-full">{email}</p>
                <button
                    type="button"
                    onClick={onBackToEmail}
                    className="text-xs text-primary hover:underline mt-1 font-medium"
                >
                    Alterar e-mail
                </button>
            </div>

            <div className="space-y-3">
                <Button
                    type="button"
                    className="btn-brand w-full !h-auto min-h-[60px] flex flex-col justify-center items-center py-4"
                    onClick={onRequestQuickAccess}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <i className="ri-loader-4-line animate-spin" />
                            Enviando link...
                        </span>
                    ) : (
                        <>
                            <span className="flex items-center gap-2 text-sm font-semibold">
                                <i className="ri-magic-line text-base" />
                                Receber Acesso Rápido
                            </span>
                            <span className="text-[10px] opacity-80 font-normal mt-0.5">
                                Sem senha por e-mail ou WhatsApp
                            </span>
                        </>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-border/80 hover:bg-muted/30"
                    onClick={onSelectPassword}
                >
                    <span className="flex items-center gap-2">
                        <i className="ri-lock-line" />
                        Entrar com Senha
                    </span>
                </Button>
            </div>
        </div>
    );
}
