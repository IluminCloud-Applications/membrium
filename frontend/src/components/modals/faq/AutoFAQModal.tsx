/**
 * AutoFAQModal — Modal de FAQ Automático.
 *
 * Funciona igual ao AutoTranscriptModal de Transcrições:
 * 1. Carrega todas as aulas com seu status (FAQ, transcrição, YouTube)
 * 2. Mostra estatísticas resumidas
 * 3. Permite selecionar o modelo de IA
 * 4. Inicia a geração em lote, aula por aula
 *
 * Lógica de geração por aula:
 * - Tem transcrição → gera FAQ diretamente
 * - Sem transcrição + é YouTube → backend busca a transcrição e depois gera
 * - Sem transcrição + não é YouTube → bloqueado (canGenerate = false)
 */

import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ModelCombobox } from "@/components/settings/ai/ModelCombobox";
import { AutoFAQTable } from "./AutoFAQTable";
import { faqService, type FAQPendingLesson } from "@/services/faq";
import { useAIModels } from "@/hooks/useAIModels";

interface AutoFAQModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartGeneration: (lessons: FAQPendingLesson[], provider: string, model: string) => void;
}

export function AutoFAQModal({
    open,
    onOpenChange,
    onStartGeneration,
}: AutoFAQModalProps) {
    const [lessons, setLessons] = useState<FAQPendingLesson[]>([]);
    const [loading, setLoading] = useState(false);

    // AI model selection (reusable hook — same as transcript modal)
    const ai = useAIModels(open);

    // Fetch lessons when modal opens
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        faqService
            .getPendingLessons()
            .then(setLessons)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open]);

    // Split by status
    const processable = useMemo(
        () => lessons.filter((l) => l.canGenerate),
        [lessons]
    );

    const withoutFaq = useMemo(
        () => processable.filter((l) => !l.hasFaq),
        [processable]
    );

    const blocked = useMemo(
        () => lessons.filter((l) => !l.canGenerate),
        [lessons]
    );

    const stats = useMemo(() => ({
        total: lessons.length,
        processable: processable.length,
        withoutFaq: withoutFaq.length,
        blocked: blocked.length,
    }), [lessons, processable, withoutFaq, blocked]);

    function handleStart() {
        if (processable.length === 0 || !ai.model) return;
        // Only generate for lessons without FAQ (avoid overwriting existing)
        const targets = withoutFaq.length > 0 ? withoutFaq : processable;
        onStartGeneration(targets, ai.provider, ai.model);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-robot-2-line text-primary" />
                        FAQ Automático
                    </DialogTitle>
                    <DialogDescription>
                        Gera FAQs automaticamente com IA para aulas que têm transcrição ou vídeo no YouTube.
                    </DialogDescription>
                </DialogHeader>

                {/* Stats badges */}
                <div className="flex gap-3">
                    <StatBadge
                        label="Total de Aulas"
                        value={stats.total}
                        icon="ri-book-open-line"
                    />
                    <StatBadge
                        label="Sem FAQ"
                        value={stats.withoutFaq}
                        icon="ri-time-line"
                        variant="warning"
                    />
                    <StatBadge
                        label="Processáveis"
                        value={stats.processable}
                        icon="ri-checkbox-circle-line"
                        variant="success"
                    />
                    <StatBadge
                        label="Bloqueadas"
                        value={stats.blocked}
                        icon="ri-lock-line"
                        variant="blocked"
                    />
                </div>

                {/* Info note */}
                {stats.blocked > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                        <i className="ri-information-line mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>{stats.blocked} aula{stats.blocked !== 1 ? "s" : ""}</strong> não podem ser processadas automaticamente porque não têm transcrição nem vídeo do YouTube.
                            Adicione a transcrição manualmente para habilitá-las.
                        </span>
                    </div>
                )}

                {/* Model selector */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Modelo de IA</Label>
                    <ModelCombobox
                        models={ai.models}
                        value={ai.model}
                        onValueChange={ai.setModel}
                        placeholder="Selecione o modelo de IA..."
                        loading={ai.loading}
                    />
                    <p className="text-xs text-muted-foreground">
                        O modelo irá analisar a transcrição e gerar perguntas frequentes relevantes para cada aula.
                    </p>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <i className="ri-loader-4-line animate-spin text-xl mr-2" />
                        Carregando aulas...
                    </div>
                ) : (
                    <AutoFAQTable lessons={lessons} />
                )}

                <DialogFooter className="gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleStart}
                        className="btn-brand"
                        disabled={stats.processable === 0 || !ai.model}
                    >
                        <i className="ri-play-line mr-1" />
                        Gerar FAQ para {withoutFaq.length > 0 ? withoutFaq.length : processable.length} aula{(withoutFaq.length || processable.length) !== 1 ? "s" : ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---- Stat Badge ---- */

function StatBadge({
    label,
    value,
    icon,
    variant = "default",
}: {
    label: string;
    value: number;
    icon: string;
    variant?: "default" | "warning" | "success" | "blocked";
}) {
    const colors = {
        default: "bg-muted/50 text-foreground",
        warning: "bg-amber-500/10 text-amber-600",
        success: "bg-emerald-500/10 text-emerald-600",
        blocked: "bg-muted/30 text-muted-foreground",
    };

    return (
        <div className={`flex-1 rounded-lg px-4 py-3 ${colors[variant]}`}>
            <div className="flex items-center gap-2 text-xs font-medium opacity-80">
                <i className={icon} />
                {label}
            </div>
            <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
    );
}
