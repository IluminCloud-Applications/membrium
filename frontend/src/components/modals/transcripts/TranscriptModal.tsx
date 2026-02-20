import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TranscriptFormLesson } from "./TranscriptFormLesson";
import { TranscriptFormContent } from "./TranscriptFormContent";
import type {
    Transcript,
    TranscriptCourse,
    TranscriptModule,
    TranscriptLesson,
} from "@/types/transcript";

export interface TranscriptFormData {
    lessonId: string;
    text: string;
    vector: string;
    keywords: string[];
}

interface TranscriptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: Transcript | null;
    courses: TranscriptCourse[];
    modules: TranscriptModule[];
    lessons: TranscriptLesson[];
    onSubmit: (data: TranscriptFormData) => void;
    onYoutubeImport: () => void;
}

const emptyForm: TranscriptFormData = {
    lessonId: "",
    text: "",
    vector: "",
    keywords: [],
};

export function TranscriptModal({
    open,
    onOpenChange,
    editItem,
    courses,
    modules,
    lessons,
    onSubmit,
    onYoutubeImport,
}: TranscriptModalProps) {
    const [form, setForm] = useState<TranscriptFormData>(emptyForm);
    const [courseId, setCourseId] = useState("");
    const [moduleId, setModuleId] = useState("");
    const isEditing = !!editItem;
    const lessonSelected = !!form.lessonId;

    useEffect(() => {
        if (editItem) {
            setForm({
                lessonId: editItem.lessonId.toString(),
                text: editItem.text,
                vector: editItem.vector,
                keywords: [...editItem.keywords],
            });
            const lesson = lessons.find((l) => l.id === editItem.lessonId);
            if (lesson) {
                setModuleId(lesson.moduleId.toString());
                const mod = modules.find((m) => m.id === lesson.moduleId);
                if (mod) setCourseId(mod.courseId.toString());
            }
        } else {
            setForm(emptyForm);
            setCourseId("");
            setModuleId("");
        }
    }, [editItem, open, lessons, modules]);

    function handleCourseChange(value: string) {
        setCourseId(value);
        setModuleId("");
        setForm((prev) => ({ ...prev, lessonId: "" }));
    }

    function handleModuleChange(value: string) {
        setModuleId(value);
        setForm((prev) => ({ ...prev, lessonId: "" }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    // Resolve selected lesson name for the header
    const selectedLesson = lessons.find(
        (l) => l.id === Number(form.lessonId)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-h-[90vh] overflow-y-auto transition-all ${lessonSelected ? "sm:max-w-3xl" : "sm:max-w-md"
                    }`}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i
                            className={`${isEditing ? "ri-pencil-line" : "ri-add-line"} text-primary`}
                        />
                        {isEditing ? "Editar Transcrição" : "Nova Transcrição"}
                    </DialogTitle>
                    <DialogDescription>
                        {!lessonSelected
                            ? "Primeiro, selecione a aula que receberá a transcrição."
                            : isEditing
                                ? "Atualize o conteúdo e as palavras-chave da transcrição."
                                : "Preencha a transcrição, resumo e palavras-chave."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Step 1: Lesson selector (always visible) */}
                    <TranscriptFormLesson
                        courseId={courseId}
                        moduleId={moduleId}
                        lessonId={form.lessonId}
                        courses={courses}
                        modules={modules}
                        lessons={lessons}
                        onCourseChange={handleCourseChange}
                        onModuleChange={handleModuleChange}
                        onLessonChange={(v) =>
                            setForm((prev) => ({ ...prev, lessonId: v }))
                        }
                        selectedLessonName={selectedLesson?.name}
                    />

                    {/* Step 2: Content fields (only after lesson is selected) */}
                    {lessonSelected && (
                        <div className="animate-fade-in">
                            <TranscriptFormContent
                                transcriptText={form.text}
                                vector={form.vector}
                                keywords={form.keywords}
                                onTranscriptTextChange={(v) =>
                                    setForm((prev) => ({ ...prev, text: v }))
                                }
                                onVectorChange={(v) =>
                                    setForm((prev) => ({ ...prev, vector: v }))
                                }
                                onKeywordsChange={(kw) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        keywords: kw,
                                    }))
                                }
                                onYoutubeImport={onYoutubeImport}
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-2">
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
                            disabled={!lessonSelected}
                        >
                            <i
                                className={`${isEditing ? "ri-save-line" : "ri-add-line"} mr-1`}
                            />
                            {isEditing
                                ? "Salvar Alterações"
                                : "Criar Transcrição"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
