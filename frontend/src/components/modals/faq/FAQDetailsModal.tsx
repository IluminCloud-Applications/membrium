import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FAQLessonGroup } from "@/types/faq";

interface FAQDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: FAQLessonGroup | null;
    onEdit: (item: FAQLessonGroup) => void;
}

export function FAQDetailsModal({
    open,
    onOpenChange,
    item,
    onEdit,
}: FAQDetailsModalProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-question-answer-line text-primary" />
                        Detalhes do FAQ
                    </DialogTitle>
                </DialogHeader>

                {/* Lesson info */}
                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
                    <InfoBlock label="Curso" value={item.courseName} />
                    <InfoBlock label="Módulo" value={item.moduleName} />
                    <InfoBlock label="Aula" value={item.lessonName} />
                </div>

                {/* FAQ items */}
                <div className="space-y-3">
                    {item.faqs.map((faq, idx) => (
                        <div
                            key={faq.id}
                            className="rounded-lg border overflow-hidden"
                        >
                            <div className="bg-muted/50 px-4 py-2.5 border-b">
                                <h4 className="text-sm font-medium flex items-center gap-1.5">
                                    <i className="ri-question-line text-primary text-sm" />
                                    Pergunta {idx + 1}
                                </h4>
                            </div>
                            <div className="p-4 space-y-3">
                                <p className="text-sm font-medium text-foreground">
                                    {faq.question}
                                </p>
                                <div className="pl-3 border-l-2 border-primary/20">
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Date */}
                <div className="flex items-center justify-end text-xs text-muted-foreground pt-3 border-t">
                    <span>
                        Atualizado em:{" "}
                        <strong>
                            {item.updatedAt
                                ? new Date(item.updatedAt).toLocaleDateString("pt-BR")
                                : "—"}
                        </strong>
                    </span>
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

/* ---- Helpers ---- */

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium truncate">{value}</p>
        </div>
    );
}
