import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface CourseHeaderProps {
    courseName: string;
    courseId?: number;
    modulesCount: number;
    lessonsCount: number;
}

export function CourseHeader({ courseName, courseId, modulesCount, lessonsCount }: CourseHeaderProps) {
    const navigate = useNavigate();

    function handlePreview() {
        if (!courseId) return;
        window.open(`/member?preview=true`, "_blank");
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
                    </div>
                </div>

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
    );
}
