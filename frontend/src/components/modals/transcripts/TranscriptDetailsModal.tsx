import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Transcript } from "@/types/transcript";

interface TranscriptDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Transcript | null;
    onEdit: (item: Transcript) => void;
}

export function TranscriptDetailsModal({
    open,
    onOpenChange,
    item,
    onEdit,
}: TranscriptDetailsModalProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-mic-2-ai-line text-primary" />
                        Detalhes da Transcrição
                    </DialogTitle>
                </DialogHeader>

                {/* Lesson info */}
                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
                    <InfoBlock label="Curso" value={item.courseName} />
                    <InfoBlock label="Módulo" value={item.moduleName} />
                    <InfoBlock label="Aula" value={item.lessonName} />
                </div>

                <div className="space-y-4">
                    {/* Transcription */}
                    <DetailSection
                        title="Transcrição"
                        icon="ri-draft-line"
                    >
                        <div className="max-h-48 overflow-y-auto pr-2">
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {item.text || "—"}
                            </p>
                        </div>
                    </DetailSection>

                    {/* Summary */}
                    <DetailSection title="Resumo" icon="ri-magic-line">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            {item.vector || "—"}
                        </p>
                    </DetailSection>

                    {/* Keywords */}
                    <DetailSection title="Palavras-chave" icon="ri-hashtag">
                        {item.keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {item.keywords.map((kw, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-primary/10 text-primary"
                                    >
                                        {kw}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Nenhuma palavra-chave
                            </p>
                        )}
                    </DetailSection>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                        <span>
                            Criado em: <strong>{item.createdAt ?? "—"}</strong>
                        </span>
                        <span>
                            Atualizado em: <strong>{item.updatedAt ?? "—"}</strong>
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            onEdit(item);
                        }}
                    >
                        <i className="ri-pencil-line mr-1" />
                        Editar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---- Internal helpers ---- */

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium truncate">{value}</p>
        </div>
    );
}

function DetailSection({
    title,
    icon,
    extra,
    children,
}: {
    title: string;
    icon: string;
    extra?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <i className={`${icon} text-primary text-sm`} />
                    {title}
                </h3>
                {extra}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}
