import { Button } from "@/components/ui/button";

interface SetupStepDoneProps {
    onGoToLogin: () => void;
}

export function SetupStepDone({ onGoToLogin }: SetupStepDoneProps) {
    return (
        <div className="text-center py-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-3xl text-emerald-500" />
            </div>

            <h3 className="text-lg font-semibold mb-2">Plataforma instalada!</h3>
            <p className="text-sm text-muted-foreground mb-6">
                Sua área de membros está pronta. Acesse o painel de administração
                para começar a configurar seus cursos e conteúdos.
            </p>

            <Button
                onClick={onGoToLogin}
                className="btn-brand w-full h-11"
            >
                <span className="flex items-center gap-2">
                    <i className="ri-login-box-line" />
                    Ir para o Login
                </span>
            </Button>
        </div>
    );
}
