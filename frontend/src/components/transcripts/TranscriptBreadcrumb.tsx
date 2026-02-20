import { Button } from "@/components/ui/button";
import type { TranscriptDrillLevel } from "@/types/transcript";

interface TranscriptBreadcrumbProps {
    level: TranscriptDrillLevel;
    courseName?: string;
    moduleName?: string;
    onNavigateCourses: () => void;
    onNavigateModules: () => void;
}

/**
 * Breadcrumb navigation for the Transcript drill-down table.
 * Shows: Cursos > CourseName > ModuleName
 */
export function TranscriptBreadcrumb({
    level,
    courseName,
    moduleName,
    onNavigateCourses,
    onNavigateModules,
}: TranscriptBreadcrumbProps) {
    if (level === "courses") return null;

    return (
        <div className="flex items-center gap-1.5 text-sm mb-4">
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={onNavigateCourses}
            >
                <i className="ri-book-open-line mr-1 text-xs" />
                Cursos
            </Button>

            {level === "modules" && courseName && (
                <>
                    <i className="ri-arrow-right-s-line text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {courseName}
                    </span>
                </>
            )}

            {level === "lessons" && (
                <>
                    <i className="ri-arrow-right-s-line text-muted-foreground" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        onClick={onNavigateModules}
                    >
                        {courseName}
                    </Button>
                    <i className="ri-arrow-right-s-line text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {moduleName}
                    </span>
                </>
            )}
        </div>
    );
}
