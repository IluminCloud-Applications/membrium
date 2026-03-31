import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LessonFormLeft } from "./LessonFormLeft";
import { LessonFormRight } from "./LessonFormRight";
import type { Lesson, LessonFormData } from "@/types/course-modification";

interface LessonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editLesson: Lesson | null;
    onSubmit: (data: LessonFormData) => void;
    isLoading?: boolean;
}

const emptyForm: LessonFormData = {
    title: "",
    description: "",
    videoPlatform: "youtube",
    videoUrl: "",
    customVideoCode: "",
    vturbVideoId: "",
    attachments: [],
    existingAttachments: [],
    hasCta: false,
    ctaText: "",
    ctaUrl: "",
    ctaDelay: 0,
};

export function LessonModal({
    open,
    onOpenChange,
    editLesson,
    onSubmit,
    isLoading,
}: LessonModalProps) {
    const [form, setForm] = useState<LessonFormData>(emptyForm);
    const isEditing = !!editLesson;

    useEffect(() => {
        if (editLesson) {
            setForm({
                title: editLesson.title,
                description: editLesson.description,
                videoPlatform: editLesson.videoPlatform,
                videoUrl: editLesson.videoUrl,
                customVideoCode: editLesson.customVideoCode,
                vturbVideoId: editLesson.videoPlatform === "vturb" ? editLesson.videoUrl : "",
                attachments: [],
                existingAttachments: [...editLesson.attachments],
                hasCta: editLesson.hasCta,
                ctaText: editLesson.cta.text,
                ctaUrl: editLesson.cta.url,
                ctaDelay: editLesson.cta.delaySeconds,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editLesson, open]);

    function handleChange(field: keyof LessonFormData, value: unknown) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-play-circle-line"} text-primary`} />
                        {isEditing ? "Editar Aula" : "Nova Aula"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações da aula."
                            : "Preencha os dados para criar uma nova aula."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Two-column grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <LessonFormLeft form={form} onChange={handleChange} />
                        <LessonFormRight form={form} onChange={handleChange} />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand"
                            disabled={isLoading || !form.title.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    {isEditing ? "Salvando..." : "Criando..."}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className={isEditing ? "ri-save-line" : "ri-add-line"} />
                                    {isEditing ? "Salvar Alterações" : "Criar Aula"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
