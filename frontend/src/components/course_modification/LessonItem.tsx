import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Lesson } from "@/types/course-modification";

interface LessonItemProps {
    lesson: Lesson;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}

export function LessonItem({ lesson, index, onEdit, onDelete }: LessonItemProps) {
    return (
        <div className="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-sm transition-all">
            {/* Drag handle */}
            <div className="flex-shrink-0 cursor-move text-muted-foreground hover:text-foreground transition-colors">
                <i className="ri-draggable text-lg" />
            </div>

            {/* Order number */}
            <div className="flex-shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
            </div>

            {/* Lesson info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{lesson.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <i className={lesson.videoPlatform === "youtube" ? "ri-youtube-line" : "ri-code-s-slash-line"} />
                        {lesson.videoPlatform === "youtube" ? "YouTube" : "Custom"}
                    </span>
                    {lesson.attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <i className="ri-attachment-2" />
                            {lesson.attachments.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div className="hidden sm:flex items-center gap-2">
                {lesson.hasCta && (
                    <Badge variant="secondary" className="text-[10px] font-medium bg-primary/8 text-primary">
                        <i className="ri-cursor-line mr-1 text-[10px]" />
                        CTA
                    </Badge>
                )}
            </div>

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <i className="ri-more-2-fill text-lg" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={onEdit} className="rounded-lg cursor-pointer">
                        <i className="ri-pencil-line mr-2 text-base" />
                        Editar Aula
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                    >
                        <i className="ri-delete-bin-line mr-2 text-base" />
                        Excluir Aula
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
