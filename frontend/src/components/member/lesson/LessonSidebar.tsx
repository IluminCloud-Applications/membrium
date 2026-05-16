import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { MemberLessonDetail, MemberLesson, MemberShowcaseItem, MemberModuleDetail } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";

interface LessonSidebarProps {
    lessons: MemberLessonDetail[];
    currentLessonId: number;
    onSelectLesson: (lessonId: number) => void;
    showcases?: MemberShowcaseItem[];
    courseModules?: MemberModuleDetail[];
    courseId: number;
    currentModuleId: number;
}

export function LessonSidebar({
    lessons,
    currentLessonId,
    onSelectLesson,
    showcases = [],
    courseModules = [],
    courseId,
    currentModuleId,
}: LessonSidebarProps) {
    const navigate = useNavigate();

    const sortedModules = useMemo(() =>
        [...courseModules].sort((a, b) => a.order - b.order),
        [courseModules]
    );

    const nextModule = useMemo(() => {
        const currentIdx = sortedModules.findIndex((m) => m.id === currentModuleId);
        if (currentIdx < 0 || currentIdx >= sortedModules.length - 1) return null;
        return sortedModules[currentIdx + 1];
    }, [sortedModules, currentModuleId]);

    const isLastLesson = useMemo(() => {
        if (lessons.length === 0) return false;
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        return currentLessonId === sorted[sorted.length - 1].id;
    }, [lessons, currentLessonId]);


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


            {/* All modules as accordion */}
            <div className="lesson-sidebar-list">
                {sortedModules.length > 0 ? (
                    sortedModules.map((mod, idx) => {
                        const currentIdx = sortedModules.findIndex((m) => m.id === currentModuleId);
                        const isBeforeCurrent = currentIdx >= 0 && idx < currentIdx;
                        return (
                            <ModuleAccordionItem
                                key={mod.id}
                                module={mod}
                                courseId={courseId}
                                isCurrent={mod.id === currentModuleId}
                                currentLessonId={currentLessonId}
                                currentModuleLessons={mod.id === currentModuleId ? lessons : undefined}
                                onSelectLesson={onSelectLesson}
                                defaultExpanded={!isBeforeCurrent}
                            />
                        );
                    })
                ) : (
                    lessons.map((lesson) => (
                        <LessonItem
                            key={lesson.id}
                            lesson={lesson}
                            isCurrent={lesson.id === currentLessonId}
                            onClick={() => onSelectLesson(lesson.id)}
                        />
                    ))
                )}

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

type AnyLesson = MemberLessonDetail | MemberLesson;

function getYoutubeThumbnail(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
    );
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim()))
        return `https://img.youtube.com/vi/${url.trim()}/mqdefault.jpg`;
    return null;
}

function getLessonThumbnail(lesson: AnyLesson): string | null {
    // 1. Always prefer the pre-generated URL stored in the database (covers both YouTube & R2)
    if (lesson.thumbnailUrl) return lesson.thumbnailUrl;
    // 2. Fallback: derive YouTube thumbnail client-side (legacy lessons without stored thumbnail)
    if (lesson.videoType === "youtube" && lesson.videoUrl)
        return getYoutubeThumbnail(lesson.videoUrl);
    return null;
}

/* ============================================ */

interface LessonItemProps {
    lesson: AnyLesson;
    isCurrent: boolean;
    onClick: () => void;
}

function LessonItem({ lesson, isCurrent, onClick }: LessonItemProps) {
    const thumbnail = getLessonThumbnail(lesson);
    const [imgError, setImgError] = useState(false);

    return (
        <button
            className={`lesson-sidebar-item ${isCurrent ? "lesson-sidebar-item-active" : ""} ${lesson.completed ? "lesson-sidebar-item-completed" : ""}`}
            onClick={onClick}
        >
            {/* Thumbnail */}
            <div className="lesson-sidebar-thumb">
                {thumbnail && !imgError ? (
                    <img
                        src={thumbnail}
                        alt={lesson.title}
                        className="lesson-sidebar-thumb-img"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="lesson-sidebar-thumb-placeholder">
                        <i className="ri-play-fill" />
                    </div>
                )}
                {lesson.completed && (
                    <div className="lesson-sidebar-thumb-check">
                        <i className="ri-check-line" />
                    </div>
                )}
                {isCurrent && !lesson.completed && (
                    <div className="lesson-sidebar-thumb-playing">
                        <i className="ri-play-fill" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="lesson-sidebar-item-info">
                <p className="lesson-sidebar-item-title">{lesson.title}</p>
                {isCurrent && (
                    <span className="lesson-sidebar-item-badge">Assistindo</span>
                )}
            </div>
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
    defaultExpanded?: boolean;
}

function ModuleAccordionItem({
    module,
    courseId,
    isCurrent,
    currentLessonId,
    currentModuleLessons,
    onSelectLesson,
    defaultExpanded = true,
}: ModuleAccordionItemProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const navigate = useNavigate();

    const lessonsToShow = isCurrent && currentModuleLessons
        ? currentModuleLessons
        : module.lessons;

    const completedCount = lessonsToShow.filter((l) => l.completed).length;
    const totalCount = lessonsToShow.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
                {/* Left: name + count */}
                <div className="lesson-sidebar-module-header-info">
                    <span className="lesson-sidebar-module-name">{module.name}</span>
                    <span className="lesson-sidebar-module-count">{totalCount} conteúdo(s)</span>
                </div>

                {/* Right: donut ring + % + chevron */}
                <div className="lesson-sidebar-module-right">
                    <ModuleProgressRing pct={progressPct} />
                    <span className="lesson-sidebar-module-progress-pct">{progressPct}%</span>
                    <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line lesson-sidebar-module-chevron`} />
                </div>
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

const RING_R = 8;
const RING_C = 2 * Math.PI * RING_R;

function ModuleProgressRing({ pct }: { pct: number }) {
    const offset = RING_C * (1 - pct / 100);
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" className="module-ring-svg">
            <circle className="module-ring-track" cx="10" cy="10" r={RING_R} fill="none" strokeWidth="2" />
            <circle
                className="module-ring-fill"
                cx="10" cy="10" r={RING_R}
                fill="none"
                strokeWidth="2"
                strokeDasharray={RING_C}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 10 10)"
            />
        </svg>
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
