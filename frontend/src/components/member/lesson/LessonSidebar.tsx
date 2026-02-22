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
    moduleName,
    totalLessons,
    completedLessons,
    onSelectLesson,
    showcases = [],
    courseModules = [],
    courseId,
    currentModuleId,
}: LessonSidebarProps) {
    const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Pick up to 2 random showcases
    const selectedShowcases = useMemo(() => {
        if (showcases.length <= 2) return showcases;
        const shuffled = [...showcases].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    }, [showcases]);

    // Other modules (excluding current)
    const otherModules = useMemo(() =>
        courseModules
            .filter((m) => m.id !== currentModuleId)
            .sort((a, b) => a.order - b.order),
        [courseModules, currentModuleId]
    );

    return (
        <aside className="lesson-sidebar">
            {/* Header - current module */}
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

            {/* Lesson List - current module */}
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
                            <p className="lesson-sidebar-item-title">{lesson.title}</p>
                        </button>
                    );
                })}
            </div>

            {/* Other modules */}
            {otherModules.length > 0 && (
                <div className="lesson-sidebar-modules">
                    <div className="lesson-sidebar-modules-title">
                        <i className="ri-folder-line" />
                        <span>Outros módulos</span>
                    </div>
                    {otherModules.map((mod) => (
                        <ModuleAccordionItem
                            key={mod.id}
                            module={mod}
                            courseId={courseId}
                        />
                    ))}
                </div>
            )}

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

interface ModuleAccordionItemProps {
    module: MemberModuleDetail;
    courseId: number;
}

function ModuleAccordionItem({ module, courseId }: ModuleAccordionItemProps) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();
    const completedCount = module.lessons.filter((l) => l.completed).length;
    const totalCount = module.lessons.length;

    function handleLessonClick(lessonId: number) {
        navigate(`/member/${courseId}/${module.id}?lesson=${lessonId}`);
    }

    return (
        <div className="lesson-sidebar-module-item">
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
                    {module.lessons.map((lesson) => (
                        <button
                            key={lesson.id}
                            className={`lesson-sidebar-item ${lesson.completed ? "lesson-sidebar-item-completed" : ""}`}
                            onClick={() => handleLessonClick(lesson.id)}
                        >
                            <div className="lesson-sidebar-item-icon">
                                {lesson.completed ? (
                                    <i className="ri-check-line" />
                                ) : (
                                    <span>{lesson.order}</span>
                                )}
                            </div>
                            <p className="lesson-sidebar-item-title">{lesson.title}</p>
                        </button>
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
