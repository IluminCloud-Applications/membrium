import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { courseModificationService } from "@/services/courseModification";
import { coursesService } from "@/services/courses";
import { toast } from "sonner";

interface CourseHeaderProps {
    courseName: string;
    courseId?: number;
    modulesCount: number;
    lessonsCount: number;
    isPublished: boolean;
    onPublished: () => void;
}

export function CourseHeader({ courseName, courseId, modulesCount, lessonsCount, isPublished, onPublished }: CourseHeaderProps) {
    const navigate = useNavigate();
    const [exporting, setExporting] = useState(false);
    const [publishing, setPublishing] = useState(false);

    function handlePreview() {
        if (!courseId) return;
        window.open(`/member?preview=true`, "_blank");
    }

    async function handleExport() {
        if (!courseId) return;
        setExporting(true);
        try {
            await courseModificationService.exportCourse(courseId, courseName);
            toast.success("Curso exportado com sucesso!");
        } catch (err) {
            console.error("Erro ao exportar curso:", err);
            toast.error("Erro ao exportar curso");
        } finally {
            setExporting(false);
        }
    }

    async function handlePublish() {
        if (!courseId) return;
        setPublishing(true);
        try {
            await coursesService.publish(courseId);
            toast.success("Curso publicado com sucesso!");
            onPublished();
        } catch (err) {
            console.error("Erro ao publicar curso:", err);
            toast.error("Erro ao publicar curso");
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Breadcrumb */}
            <button
                onClick={() => navigate("/admin/cursos")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <i className="ri-arrow-left-line text-base" />
                Voltar para Cursos
            </button>

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <i className="ri-settings-3-line text-primary" />
                        {courseName}
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="secondary" className="text-xs font-medium">
                            <i className="ri-folder-3-line mr-1" />
                            {modulesCount} {modulesCount === 1 ? "módulo" : "módulos"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-medium">
                            <i className="ri-play-circle-line mr-1" />
                            {lessonsCount} {lessonsCount === 1 ? "aula" : "aulas"}
                        </Badge>
                        {!isPublished && (
                            <Badge className="text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/40">
                                <i className="ri-draft-line mr-1" />
                                Rascunho
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPublished && (
                        <Button
                            size="sm"
                            onClick={handlePublish}
                            disabled={publishing}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {publishing ? (
                                <i className="ri-loader-4-line animate-spin" />
                            ) : (
                                <i className="ri-send-plane-line" />
                            )}
                            Publicar Curso
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exporting}
                        className="gap-2"
                    >
                        {exporting ? (
                            <i className="ri-loader-4-line animate-spin" />
                        ) : (
                            <i className="ri-download-2-line" />
                        )}
                        Exportar Curso
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        className="gap-2"
                    >
                        <i className="ri-eye-line" />
                        Ver como Aluno
                    </Button>
                </div>
            </div>
        </div>
    );
}
