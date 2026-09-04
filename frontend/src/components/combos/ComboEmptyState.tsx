import { Button } from "@/components/ui/button";

interface ComboEmptyStateProps {
    onCreateCombo: () => void;
}

export function ComboEmptyState({ onCreateCombo }: ComboEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-xl bg-card/50">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <i className="ri-stack-line text-3xl" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum combo criado ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                Crie um combo para empacotar múltiplos cursos em uma única oferta (ex: "Tudo Vitalício", "Combo de Lançamento"). O webhook gerado cadastrará e entregará todos os cursos de uma vez só para o aluno.
            </p>
            <Button onClick={onCreateCombo} className="btn-brand">
                <i className="ri-add-line mr-1.5" />
                Criar Primeiro Combo
            </Button>
        </div>
    );
}
