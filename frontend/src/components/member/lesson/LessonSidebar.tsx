import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { MemberLessonDetail, MemberShowcaseItem, MemberModuleDetail } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";

interface LessonSidebarProps {
    lessons: MemberLessonDetail[];
    currentLessonId: number;
    moduleName: string;
    totalLessons: number;
    completedLessons: number;
    onSelectLesson: (lessonId: number) => void;
    showcases?: MemberShowcaseItem[];
    courseModules?: MemberModuleDetail[];
    courseId: number;
    currentModuleId: number;
}

export function LessonSidebar({
    lessons,
    currentLessonId,
    totalLessons,
    completedLessons,
    onSelectLesson,
    showcases = [],
    courseModules = [],
    courseId,
    currentModuleId,
}: LessonSidebarProps) {
    const navigate = useNavigate();

    // Sort all modules by order
    const sortedModules = useMemo(() =>
        [...courseModules].sort((a, b) => a.order - b.order),
        [courseModules]
    );

    // Next module (for the "go to next module" button)
    const nextModule = useMemo(() => {
        const currentIdx = sortedModules.findIndex((m) => m.id === currentModuleId);
        if (currentIdx < 0 || currentIdx >= sortedModules.length - 1) return null;
        return sortedModules[currentIdx + 1];
    }, [sortedModules, currentModuleId]);

    // Only show "next module" button on the last lesson
    const isLastLesson = useMemo(() => {
        if (lessons.length === 0) return false;
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        return currentLessonId === sorted[sorted.length - 1].id;
    }, [lessons, currentLessonId]);

    // Global progress
    const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Pick up to 2 random showcases
    const selectedShowcases = useMemo(() => {
        if (showcases.length <= 2) return showcases;
        const shuffled = [...showcases].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    }, [showcases]);

    function handleGoToNextModule() {
        if (!nextModule || nextModule.lessons.length === 0) return;
        const firstLesson = nextModule.lessons.sort((a, b) => a.order - b.order)[0];
        navigate(`/member/${courseId}/${nextModule.id}?lesson=${firstLesson.id}`);
    }

    return (
        <aside className="lesson-sidebar">
            {/* Progress header */}
            <div className="lesson-sidebar-header">
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

            {/* All modules as accordion */}
            <div className="lesson-sidebar-list">
                {sortedModules.length > 0 ? (
                    sortedModules.map((mod) => (
                        <ModuleAccordionItem
                            key={mod.id}
                            module={mod}
                            courseId={courseId}
                            isCurrent={mod.id === currentModuleId}
                            currentLessonId={currentLessonId}
                            currentModuleLessons={mod.id === currentModuleId ? lessons : undefined}
                            onSelectLesson={onSelectLesson}
                        />
                    ))
                ) : (
                    /* Fallback: no modules loaded, show lessons directly */
                    lessons.map((lesson) => (
                        <LessonItem
                            key={lesson.id}
                            lesson={lesson}
                            isCurrent={lesson.id === currentLessonId}
                            onClick={() => onSelectLesson(lesson.id)}
                        />
                    ))
                )}

                {/* Next module button */}
                {nextModule && isLastLesson && (
                    <button
                        className="lesson-sidebar-next-module"
                        onClick={handleGoToNextModule}
                    >
                        <span>Próximo módulo</span>
                        <i className="ri-arrow-right-line" />
                    </button>
                )}
            </div>

            {/* Showcase banners */}
            {selectedShowcases.length > 0 && (
                <div className="lesson-sidebar-showcases">
                    {selectedShowcases.map((item) => (
                        <SidebarShowcaseBanner key={item.id} item={item} />
                    ))}
                </div>
            )}
        </aside>
    );
}

/* ============================================ */

interface LessonItemProps {
    lesson: MemberLessonDetail | { id: number; title: string; order: number; completed: boolean };
    isCurrent: boolean;
    onClick: () => void;
}

function LessonItem({ lesson, isCurrent, onClick }: LessonItemProps) {
    return (
        <button
            className={`lesson-sidebar-item ${isCurrent ? "lesson-sidebar-item-active" : ""} ${lesson.completed ? "lesson-sidebar-item-completed" : ""}`}
            onClick={onClick}
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
            <p className="lesson-sidebar-item-title">{lesson.title}</p>
        </button>
    );
}

/* ============================================ */

interface ModuleAccordionItemProps {
    module: MemberModuleDetail;
    courseId: number;
    isCurrent: boolean;
    currentLessonId: number;
    currentModuleLessons?: MemberLessonDetail[];
    onSelectLesson: (lessonId: number) => void;
}

function ModuleAccordionItem({
    module,
    courseId,
    isCurrent,
    currentLessonId,
    currentModuleLessons,
    onSelectLesson,
}: ModuleAccordionItemProps) {
    const [expanded, setExpanded] = useState(isCurrent);
    const navigate = useNavigate();

    // Use currentModuleLessons (with real-time completion state) for the active module
    const lessonsToShow = isCurrent && currentModuleLessons
        ? currentModuleLessons
        : module.lessons;

    const completedCount = lessonsToShow.filter((l) => l.completed).length;
    const totalCount = lessonsToShow.length;

    function handleLessonClick(lessonId: number) {
        if (isCurrent) {
            onSelectLesson(lessonId);
        } else {
            navigate(`/member/${courseId}/${module.id}?lesson=${lessonId}`);
        }
    }

    return (
        <div className={`lesson-sidebar-module-item ${isCurrent ? "lesson-sidebar-module-current" : ""}`}>
            <button
                className="lesson-sidebar-module-header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="lesson-sidebar-module-info">
                    <span className="lesson-sidebar-module-name">{module.name}</span>
                    <span className="lesson-sidebar-module-count">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line`} />
            </button>

            {expanded && (
                <div className="lesson-sidebar-module-lessons">
                    {lessonsToShow.map((lesson) => (
                        <LessonItem
                            key={lesson.id}
                            lesson={lesson}
                            isCurrent={isCurrent && lesson.id === currentLessonId}
                            onClick={() => handleLessonClick(lesson.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ============================================ */

interface SidebarShowcaseBannerProps {
    item: MemberShowcaseItem;
}

function SidebarShowcaseBanner({ item }: SidebarShowcaseBannerProps) {
    function handleClick() {
        memberService.trackShowcaseClick(item.id).catch(() => { });
        window.open(item.url, "_blank", "noopener,noreferrer");
    }

    return (
        <button className="lesson-sidebar-showcase" onClick={handleClick} title={item.title}>
            {item.imageUrl ? (
                <LazyImage
                    className="lesson-sidebar-showcase-img"
                    src={item.imageUrl}
                    alt={item.title}
                    rootMargin="100px"
                    fallbackIcon="ri-image-line"
                />
            ) : (
                <div className="lesson-sidebar-showcase-placeholder">
                    <i className="ri-rocket-2-line" />
                </div>
            )}
            <div className="lesson-sidebar-showcase-overlay">
                <i className="ri-lock-unlock-line" />
                <span>{item.title}</span>
            </div>
        </button>
    );
}
