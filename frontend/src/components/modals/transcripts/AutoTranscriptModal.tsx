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
import { AutoTranscriptTable } from "./AutoTranscriptTable";
import { transcriptsService } from "@/services/transcripts";
import { aiService } from "@/services/ai";
import type { PendingLesson } from "@/types/transcript";
import type { AIModel } from "@/services/ai";

interface AutoTranscriptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartGeneration: (lessons: PendingLesson[], provider: string, model: string) => void;
}

export function AutoTranscriptModal({
    open,
    onOpenChange,
    onStartGeneration,
}: AutoTranscriptModalProps) {
    const [lessons, setLessons] = useState<PendingLesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState("gemini");
    const [model, setModel] = useState("");
    const [models, setModels] = useState<AIModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    // Fetch pending lessons when modal opens
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        transcriptsService
            .getPendingLessons()
            .then(setLessons)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open]);

    // Fetch AI models (settings)
    useEffect(() => {
        if (!open) return;
        setModelsLoading(true);
        aiService
            .getAll()
            .then((data) => {
                const geminiEnabled = data.gemini.enabled;
                const openaiEnabled = data.openai.enabled;

                if (geminiEnabled && data.gemini.api_key) {
                    setProvider("gemini");
                    aiService
                        .fetchGeminiModels(data.gemini.api_key)
                        .then((res) => setModels(res.models || []))
                        .catch(console.error)
                        .finally(() => setModelsLoading(false));
                } else if (openaiEnabled && data.openai.api_key) {
                    setProvider("openai");
                    aiService
                        .fetchOpenAIModels(data.openai.api_key)
                        .then((res) => setModels(res.models || []))
                        .catch(console.error)
                        .finally(() => setModelsLoading(false));
                } else {
                    setModelsLoading(false);
                }
            })
            .catch(() => setModelsLoading(false));
    }, [open]);

    // Filter only lessons that need something
    const pendingLessons = useMemo(() =>
        lessons.filter(
            (l) => !l.hasTranscript || !l.hasSummary || !l.hasKeywords
        ),
        [lessons]);

    const pendingWithYoutube = useMemo(() =>
        pendingLessons.filter((l) => l.isYoutube || l.hasTranscript),
        [pendingLessons]);

    const stats = useMemo(() => ({
        total: lessons.length,
        pending: pendingLessons.length,
        processable: pendingWithYoutube.length,
    }), [lessons, pendingLessons, pendingWithYoutube]);

    function handleStart() {
        if (pendingWithYoutube.length === 0 || !model) return;
        onStartGeneration(pendingWithYoutube, provider, model);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-robot-2-line text-primary" />
                        Transcrição Automática
                    </DialogTitle>
                    <DialogDescription>
                        Gera transcrições do YouTube e metadados (resumo + keywords) automaticamente com IA.
                    </DialogDescription>
                </DialogHeader>

                {/* Stats badges */}
                <div className="flex gap-3">
                    <StatBadge label="Total de Aulas" value={stats.total} icon="ri-book-open-line" />
                    <StatBadge label="Pendentes" value={stats.pending} icon="ri-time-line" variant="warning" />
                    <StatBadge label="Processáveis" value={stats.processable} icon="ri-checkbox-circle-line" variant="success" />
                </div>

                {/* Model selector */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Modelo de IA para Metadados</Label>
                    <ModelCombobox
                        models={models}
                        value={model}
                        onValueChange={setModel}
                        placeholder="Selecione o modelo de IA..."
                        loading={modelsLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                        O modelo será usado para gerar resumo e palavras-chave de cada transcrição.
                    </p>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <i className="ri-loader-4-line animate-spin text-xl mr-2" />
                        Carregando aulas...
                    </div>
                ) : (
                    <AutoTranscriptTable lessons={lessons} />
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
                        disabled={stats.processable === 0 || !model}
                    >
                        <i className="ri-play-line mr-1" />
                        Gerar {stats.processable} Transcrições
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
    variant?: "default" | "warning" | "success";
}) {
    const colors = {
        default: "bg-muted/50 text-foreground",
        warning: "bg-amber-500/10 text-amber-600",
        success: "bg-emerald-500/10 text-emerald-600",
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
