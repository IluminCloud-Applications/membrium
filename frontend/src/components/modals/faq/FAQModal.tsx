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
import { FAQFormLesson } from "./FAQFormLesson";
import { FAQFormQuestions } from "./FAQFormQuestions";
import type {
    FAQItem,
    FAQLessonGroup,
    FAQCourse,
    FAQModule,
    FAQLesson,
} from "@/types/faq";

export interface FAQFormData {
    lessonId: string;
    faqs: FAQItem[];
}

interface FAQModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: FAQLessonGroup | null;
    courses: FAQCourse[];
    modules: FAQModule[];
    lessons: FAQLesson[];
    onSubmit: (data: FAQFormData) => void;
    onGenerateAI: () => void;
}

const emptyFaq: FAQItem = { id: 1, question: "", answer: "" };

const emptyForm: FAQFormData = {
    lessonId: "",
    faqs: [emptyFaq, { id: 2, question: "", answer: "" }, { id: 3, question: "", answer: "" }],
};

export function FAQModal({
    open,
    onOpenChange,
    editItem,
    courses,
    modules,
    lessons,
    onSubmit,
    onGenerateAI,
}: FAQModalProps) {
    const [form, setForm] = useState<FAQFormData>(emptyForm);
    const [courseId, setCourseId] = useState("");
    const [moduleId, setModuleId] = useState("");
    const isEditing = !!editItem;
    const lessonSelected = !!form.lessonId;

    useEffect(() => {
        if (editItem) {
            setForm({
                lessonId: editItem.lessonId.toString(),
                faqs: [...editItem.faqs],
            });
            // Resolve course/module from lesson data
            const module = modules.find((m) => m.id === editItem.moduleId);
            if (module) {
                setCourseId(module.courseId.toString());
                setModuleId(module.id.toString());
            }
        } else {
            setForm(emptyForm);
            setCourseId("");
            setModuleId("");
        }
    }, [editItem, open, modules]);

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
                            className={`${isEditing ? "ri-pencil-line" : "ri-add-line"
                                } text-primary`}
                        />
                        {isEditing ? "Editar FAQ" : "Novo FAQ"}
                    </DialogTitle>
                    <DialogDescription>
                        {!lessonSelected
                            ? "Primeiro, selecione a aula que receberá o FAQ."
                            : isEditing
                                ? "Atualize as perguntas e respostas do FAQ."
                                : "Preencha as perguntas frequentes para esta aula."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Step 1: Lesson selector */}
                    <FAQFormLesson
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

                    {/* Step 2: FAQ questions (only after lesson selected) */}
                    {lessonSelected && (
                        <div className="animate-fade-in">
                            <FAQFormQuestions
                                faqs={form.faqs}
                                onFaqsChange={(faqs) =>
                                    setForm((prev) => ({ ...prev, faqs }))
                                }
                                onGenerateAI={onGenerateAI}
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
                                className={`${isEditing ? "ri-save-line" : "ri-add-line"
                                    } mr-1`}
                            />
                            {isEditing ? "Salvar Alterações" : "Criar FAQ"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
