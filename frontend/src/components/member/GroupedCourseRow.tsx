import { useRef, useState, useCallback } from "react";
import type { MemberCourse } from "@/types/member";
import { ModuleGrid } from "./ModuleGrid";

interface GroupedCourseRowProps {
    course: MemberCourse;
    onModuleClick: (courseId: number, moduleId: number) => void;
}

export function GroupedCourseRow({ course, onModuleClick }: GroupedCourseRowProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const handleScrollState = useCallback((left: boolean, right: boolean) => {
        setCanScrollLeft(left);
        setCanScrollRight(right);
    }, []);

    function scrollModules(direction: "left" | "right") {
        const el = trackRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }

    const isLocked = course.hasAccess === false;
    const showArrows = canScrollLeft || canScrollRight;
    const categoryLabel = course.category === "bonus" ? "Bônus"
        : course.category === "order_bump" ? "Order Bump"
            : course.category === "upsell" ? "Upsell"
                : null;

    return (
        <div className={`grouped-course-row ${isLocked ? "grouped-course-row-locked" : ""}`}>
            {/* Course title bar */}
            <div className="grouped-course-row-header">
                <div className="grouped-course-row-title-wrap">
                    <h3 className="grouped-course-row-title">
                        {course.name}
                    </h3>
                    {categoryLabel && (
                        <span className="member-course-badge">{categoryLabel}</span>
                    )}
                    {isLocked && (
                        <span className="grouped-course-locked-badge">
                            <i className="ri-lock-line" />
                            Bloqueado
                        </span>
                    )}
                </div>

                {showArrows && !isLocked && (
                    <div className="member-course-nav-arrows">
                        {canScrollLeft && (
                            <button
                                className="member-course-nav-btn"
                                onClick={() => scrollModules("left")}
                                aria-label="Anterior"
                            >
                                <i className="ri-arrow-left-s-line" />
                            </button>
                        )}
                        {canScrollRight && (
                            <button
                                className="member-course-nav-btn"
                                onClick={() => scrollModules("right")}
                                aria-label="Próximo"
                            >
                                <i className="ri-arrow-right-s-line" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modules carousel */}
            {isLocked ? (
                <div className="grouped-course-locked-content">
                    <i className="ri-lock-line" />
                    <p>Adquira acesso para desbloquear este conteúdo</p>
                </div>
            ) : (
                <div className="grouped-course-row-modules">
                    <ModuleGrid
                        modules={course.modules}
                        onModuleClick={(moduleId) => onModuleClick(course.id, moduleId)}
                        externalTrackRef={trackRef}
                        onScrollStateChange={handleScrollState}
                    />
                </div>
            )}
        </div>
    );
}
