import type { MemberLessonDetail } from "@/types/member";

interface LessonSidebarProps {
    lessons: MemberLessonDetail[];
    currentLessonId: number;
    moduleName: string;
    totalLessons: number;
    completedLessons: number;
    onSelectLesson: (lessonId: number) => void;
}

export function LessonSidebar({
    lessons,
    currentLessonId,
    moduleName,
    totalLessons,
    completedLessons,
    onSelectLesson,
}: LessonSidebarProps) {
    const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return (
        <aside className="lesson-sidebar">
            {/* Header */}
            <div className="lesson-sidebar-header">
                <div className="lesson-sidebar-title-row">
                    <i className="ri-play-list-line" />
                    <h3>{moduleName}</h3>
                </div>
                <div className="lesson-sidebar-meta">
                    <span>{completedLessons}/{totalLessons} aulas</span>
                    <span className="lesson-sidebar-progress-text">{progress}%</span>
                </div>
                <div className="lesson-sidebar-progress-bar">
                    <div
                        className="lesson-sidebar-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* List */}
            <div className="lesson-sidebar-list">
                {lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    return (
                        <button
                            key={lesson.id}
                            className={`lesson-sidebar-item ${isCurrent ? "lesson-sidebar-item-active" : ""} ${lesson.completed ? "lesson-sidebar-item-completed" : ""}`}
                            onClick={() => onSelectLesson(lesson.id)}
                        >
                            <div className="lesson-sidebar-item-icon">
                                {lesson.completed ? (
                                    <i className="ri-check-line" />
                                ) : isCurrent ? (
                                    <i className="ri-play-fill" />
                                ) : (
                                    <span>{lesson.order}</span>
                                )}
                            </div>
                            <div className="lesson-sidebar-item-info">
                                <p className="lesson-sidebar-item-title">{lesson.title}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
