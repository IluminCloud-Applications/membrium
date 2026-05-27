import { Button } from "@/components/ui/button";

interface SuccessStepProps {
    message: string | null;
    onBackToPassword: () => void;
}

export function SuccessStep({ message, onBackToPassword }: SuccessStepProps) {
    return (
        <div className="space-y-5 text-center py-4 animate-scale-in">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-checkbox-circle-fill text-3xl text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Link Enviado!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {message || "Verifique sua caixa de e-mail e mensagens do WhatsApp para fazer login instantaneamente."}
            </p>

            <Button
                type="button"
                variant="outline"
                className="w-full mt-4 h-11"
                onClick={onBackToPassword}
            >
                <i className="ri-lock-line mr-2" />
                Entrar com Senha
            </Button>
        </div>
    );
}
