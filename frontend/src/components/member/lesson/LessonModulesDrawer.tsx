import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
    MemberLessonDetail,
    MemberLesson,
    MemberModuleDetail,
} from "@/types/member";

interface LessonModulesDrawerProps {
    open: boolean;
    onClose: () => void;
    lessons: MemberLessonDetail[];
    currentLessonId: number;
    courseModules: MemberModuleDetail[];
    courseId: number;
    currentModuleId: number;
    onSelectLesson: (lessonId: number) => void;
    moduleName: string;
}

export function LessonModulesDrawer({
    open,
    onClose,
    lessons,
    currentLessonId,
    courseModules,
    courseId,
    currentModuleId,
    onSelectLesson,
    moduleName,
}: LessonModulesDrawerProps) {
    /* Prevent body scroll when drawer is open */
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const sortedModules = useMemo(
        () => [...courseModules].sort((a, b) => a.order - b.order),
        [courseModules]
    );

    function handleSelectLesson(lessonId: number) {
        onSelectLesson(lessonId);
        onClose();
    }

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="lesson-drawer-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div className="lesson-drawer" role="dialog" aria-modal="true">
                {/* Drag handle */}
                <div className="lesson-drawer-handle" />

                {/* Header */}
                <div className="lesson-drawer-header">
                    <span className="lesson-drawer-title">
                        {sortedModules.length > 0 ? "Módulos & Aulas" : moduleName}
                    </span>
                    <button className="lesson-drawer-close" onClick={onClose} aria-label="Fechar">
                        <i className="ri-close-line" />
                    </button>
                </div>

                {/* Content */}
                <div className="lesson-drawer-body">
                    {sortedModules.length > 0 ? (
                        sortedModules.map((mod, idx) => {
                            const currentIdx = sortedModules.findIndex((m) => m.id === currentModuleId);
                            const isBeforeCurrent = currentIdx >= 0 && idx < currentIdx;
                            return (
                                <DrawerModuleAccordion
                                    key={mod.id}
                                    module={mod}
                                    courseId={courseId}
                                    isCurrent={mod.id === currentModuleId}
                                    currentLessonId={currentLessonId}
                                    currentModuleLessons={mod.id === currentModuleId ? lessons : undefined}
                                    onSelectLesson={handleSelectLesson}
                                    defaultExpanded={!isBeforeCurrent}
                                />
                            );
                        })
                    ) : (
                        lessons.map((lesson) => (
                            <DrawerLessonItem
                                key={lesson.id}
                                lesson={lesson}
                                isCurrent={lesson.id === currentLessonId}
                                onClick={() => handleSelectLesson(lesson.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

/* ---- Accordion por módulo ---- */
interface DrawerModuleAccordionProps {
    module: MemberModuleDetail;
    courseId: number;
    isCurrent: boolean;
    currentLessonId: number;
    currentModuleLessons?: MemberLessonDetail[];
    onSelectLesson: (lessonId: number) => void;
    defaultExpanded: boolean;
}

function DrawerModuleAccordion({
    module,
    courseId,
    isCurrent,
    currentLessonId,
    currentModuleLessons,
    onSelectLesson,
    defaultExpanded,
}: DrawerModuleAccordionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const navigate = useNavigate();

    const lessonsToShow = isCurrent && currentModuleLessons
        ? currentModuleLessons
        : module.lessons;

    const completedCount = lessonsToShow.filter((l) => l.completed).length;
    const pct = lessonsToShow.length > 0
        ? Math.round((completedCount / lessonsToShow.length) * 100)
        : 0;

    function handleLessonClick(lessonId: number) {
        if (isCurrent) {
            onSelectLesson(lessonId);
        } else {
            navigate(`/member/${courseId}/${module.id}?lesson=${lessonId}`);
        }
    }

    return (
        <div className={`lesson-drawer-module ${isCurrent ? "lesson-drawer-module-current" : ""}`}>
            <button
                className="lesson-drawer-module-header"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="lesson-drawer-module-info">
                    <span className="lesson-drawer-module-name">{module.name}</span>
                    <span className="lesson-drawer-module-meta">{lessonsToShow.length} aula(s) · {pct}%</span>
                </div>
                <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line lesson-drawer-module-chevron`} />
            </button>

            {expanded && (
                <div className="lesson-drawer-module-lessons">
                    {lessonsToShow.map((lesson) => (
                        <DrawerLessonItem
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

/* ---- Item de aula ---- */
type AnyLesson = MemberLessonDetail | MemberLesson;

function DrawerLessonItem({
    lesson,
    isCurrent,
    onClick,
}: { lesson: AnyLesson; isCurrent: boolean; onClick: () => void }) {
    return (
        <button
            className={`lesson-drawer-lesson-item ${isCurrent ? "lesson-drawer-lesson-active" : ""} ${lesson.completed ? "lesson-drawer-lesson-completed" : ""}`}
            onClick={onClick}
        >
            {/* Status icon */}
            <div className="lesson-drawer-lesson-icon">
                {lesson.completed ? (
                    <i className="ri-checkbox-circle-fill" />
                ) : isCurrent ? (
                    <i className="ri-play-circle-fill" />
                ) : (
                    <i className="ri-circle-line" />
                )}
            </div>

            <span className="lesson-drawer-lesson-title">{lesson.title}</span>

            {isCurrent && (
                <span className="lesson-drawer-lesson-badge">Assistindo</span>
            )}
        </button>
    );
}
