import { useRef, useState, useCallback } from "react";
import type { MemberCourse } from "@/types/member";
import { CourseBanner } from "./CourseBanner";
import { ModuleGrid } from "./ModuleGrid";

interface CourseSectionProps {
    course: MemberCourse;
    isPrimary?: boolean;
    onModuleClick: (courseId: number, moduleId: number) => void;
}

export function CourseSection({ course, isPrimary = false, onModuleClick }: CourseSectionProps) {
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

    const showArrows = canScrollLeft || canScrollRight;

    return (
        <section className="member-course-section">
            {/* Banner — show if course has covers */}
            {(course.coverDesktop || course.coverMobile) && (
                <CourseBanner
                    coverDesktop={course.coverDesktop}
                    coverMobile={course.coverMobile}
                    courseName={course.name}
                />
            )}

            {/* Course title with navigation arrows */}
            <div className={`member-course-header ${isPrimary ? "member-course-header-primary" : ""}`}>
                <div className="member-course-header-row">
                    <h2 className={`member-course-title ${isPrimary ? "member-course-title-primary" : ""}`}>
                        {course.name}
                        {!isPrimary && course.category !== "principal" && (
                            <span className="member-course-badge">
                                {course.category === "bonus" ? "Bônus" : course.category === "order_bump" ? "Adicional" : "Exclusivo"}
                            </span>
                        )}
                    </h2>

                    {showArrows && (
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

                {isPrimary && course.description && (
                    <p className="member-course-description">{course.description}</p>
                )}
            </div>

            {/* Modules carousel */}
            <div className="member-course-modules">
                <ModuleGrid
                    modules={course.modules}
                    onModuleClick={(moduleId) => onModuleClick(course.id, moduleId)}
                    externalTrackRef={trackRef}
                    onScrollStateChange={handleScrollState}
                />
            </div>
        </section>
    );
}
