import type { MemberLessonDetail } from "@/types/member";

interface LessonNavBarProps {
    lesson: MemberLessonDetail;
    lessons: MemberLessonDetail[];
    onPrevious: () => void;
    onNext: () => void;
    onToggleComplete: () => void;
    completing: boolean;
}

export function LessonNavBar({
    lesson,
    lessons,
    onPrevious,
    onNext,
    onToggleComplete,
    completing,
}: LessonNavBarProps) {
    const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < lessons.length - 1;

    return (
        <div className="lesson-nav-bar">
            <div className="lesson-nav-left">
                {hasPrevious && (
                    <button className="lesson-nav-btn" onClick={onPrevious}>
                        <i className="ri-arrow-left-s-line" />
                        <span className="lesson-nav-btn-text">Anterior</span>
                    </button>
                )}
                {hasNext && (
                    <button className="lesson-nav-btn" onClick={onNext}>
                        <span className="lesson-nav-btn-text">Próxima</span>
                        <i className="ri-arrow-right-s-line" />
                    </button>
                )}
            </div>

            <button
                className={`lesson-complete-btn ${lesson.completed ? "lesson-complete-btn-done" : ""}`}
                onClick={onToggleComplete}
                disabled={completing}
            >
                {completing ? (
                    <i className="ri-loader-4-line animate-spin" />
                ) : (
                    <i className={lesson.completed ? "ri-check-double-line" : "ri-check-line"} />
                )}
                <span>
                    {lesson.completed ? "Concluída" : "Marcar como concluída"}
                </span>
            </button>
        </div>
    );
}
