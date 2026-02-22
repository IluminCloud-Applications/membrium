import type { MemberCourse } from "@/types/member";
import { CourseBanner } from "./CourseBanner";
import { ModuleGrid } from "./ModuleGrid";

interface CourseSectionProps {
    course: MemberCourse;
    isPrimary?: boolean;
    onModuleClick: (courseId: number, moduleId: number) => void;
}

export function CourseSection({ course, isPrimary = false, onModuleClick }: CourseSectionProps) {
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

            {/* Course title */}
            <div className={`member-course-header ${isPrimary ? "member-course-header-primary" : ""}`}>
                <h2 className={`member-course-title ${isPrimary ? "member-course-title-primary" : ""}`}>
                    {course.name}
                    {!isPrimary && course.category !== "principal" && (
                        <span className="member-course-badge">
                            {course.category === "bonus" ? "Bônus" : course.category === "order_bump" ? "Order Bump" : "Upsell"}
                        </span>
                    )}
                </h2>
                {isPrimary && course.description && (
                    <p className="member-course-description">{course.description}</p>
                )}
            </div>

            {/* Modules grid */}
            <div className="member-course-modules">
                <ModuleGrid
                    modules={course.modules}
                    onModuleClick={(moduleId) => onModuleClick(course.id, moduleId)}
                />
            </div>
        </section>
    );
}
