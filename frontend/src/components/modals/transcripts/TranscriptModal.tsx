import { useState, useEffect, useCallback } from "react";
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
import { transcriptsService } from "@/services/transcripts";
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
    onSubmit,
    onYoutubeImport,
}: TranscriptModalProps) {
    const [form, setForm] = useState<TranscriptFormData>(emptyForm);
    const [courseId, setCourseId] = useState("");
    const [moduleId, setModuleId] = useState("");
    const [saving, setSaving] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    // Dynamic data from API
    const [courses, setCourses] = useState<TranscriptCourse[]>([]);
    const [modules, setModules] = useState<TranscriptModule[]>([]);
    const [lessons, setLessons] = useState<TranscriptLesson[]>([]);

    const isEditing = !!editItem;
    const lessonSelected = !!form.lessonId;

    // Load courses when modal opens
    useEffect(() => {
        if (open) {
            transcriptsService.getCourses().then(setCourses).catch(console.error);
        }
    }, [open]);

    // Load modules when course changes
    const loadModules = useCallback(async (cId: string) => {
        if (!cId) { setModules([]); return; }
        try {
            const data = await transcriptsService.getModules(Number(cId));
            setModules(data);
        } catch { setModules([]); }
    }, []);

    // Load lessons when module changes
    const loadLessons = useCallback(async (mId: string) => {
        if (!mId) { setLessons([]); return; }
        try {
            const data = await transcriptsService.getLessons(Number(mId));
            setLessons(data);
        } catch { setLessons([]); }
    }, []);

    // Initialize form when editing
    useEffect(() => {
        if (editItem) {
            setForm({
                lessonId: editItem.lessonId.toString(),
                text: editItem.text,
                vector: editItem.vector,
                keywords: [...editItem.keywords],
            });
            setCourseId(editItem.courseId.toString());
            setModuleId(editItem.moduleId.toString());
            loadModules(editItem.courseId.toString());
        } else {
            setForm(emptyForm);
            setCourseId("");
            setModuleId("");
            setModules([]);
            setLessons([]);
        }
    }, [editItem, open, loadModules]);

    function handleCourseChange(value: string) {
        setCourseId(value);
        setModuleId("");
        setForm((prev) => ({ ...prev, lessonId: "" }));
        setLessons([]);
        loadModules(value);
    }

    function handleModuleChange(value: string) {
        setModuleId(value);
        setForm((prev) => ({ ...prev, lessonId: "" }));
        loadLessons(value);
    }

    async function handleGenerateAI() {
        if (!form.text.trim()) return;
        setGeneratingAI(true);
        try {
            const res = await transcriptsService.generateMetadata({
                text: form.text,
                provider: "gemini",
            });
            if (res.success) {
                const keywords = res.keywords
                    ? res.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
                    : [];
                setForm((prev) => ({
                    ...prev,
                    vector: res.summary || prev.vector,
                    keywords: keywords.length > 0 ? keywords : prev.keywords,
                }));
            }
        } catch (error) {
            console.error("Erro ao gerar metadados:", error);
        } finally {
            setGeneratingAI(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit(form);
        } finally {
            setSaving(false);
        }
    }

    const selectedLessonName = isEditing
        ? editItem.lessonName
        : lessons.find((l) => l.id === Number(form.lessonId))?.name;

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
                    {/* Step 1: Lesson selector */}
                    {!isEditing && (
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
                            selectedLessonName={selectedLessonName}
                        />
                    )}

                    {/* Show lesson info badge when editing */}
                    {isEditing && (
                        <div className="rounded-lg border p-4 bg-emerald-500/5 border-emerald-500/20">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <i className="ri-checkbox-circle-fill text-emerald-500" />
                                <span>
                                    Aula:{" "}
                                    <span className="text-emerald-600">{editItem.lessonName}</span>
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {editItem.courseName} › {editItem.moduleName}
                            </p>
                        </div>
                    )}

                    {/* Step 2: Content fields */}
                    {(lessonSelected || isEditing) && (
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
                                onGenerateAI={handleGenerateAI}
                                generatingAI={generatingAI}
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand"
                            disabled={(!lessonSelected && !isEditing) || saving}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Salvando...
                                </span>
                            ) : (
                                <>
                                    <i className={`${isEditing ? "ri-save-line" : "ri-add-line"} mr-1`} />
                                    {isEditing ? "Salvar Alterações" : "Criar Transcrição"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
