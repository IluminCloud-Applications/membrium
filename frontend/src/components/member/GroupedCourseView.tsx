import type { MemberCourseGroup } from "@/types/member";
import { CourseBanner } from "./CourseBanner";
import { GroupedCourseRow } from "./GroupedCourseRow";

interface GroupedCourseViewProps {
    group: MemberCourseGroup;
    onModuleClick: (courseId: number, moduleId: number) => void;
    onBackToSelector?: () => void;
    showBack?: boolean;
}

export function GroupedCourseView({
    group,
    onModuleClick,
    onBackToSelector,
    showBack = false,
}: GroupedCourseViewProps) {
    const principal = group.courses.find((c) => c.id === group.principalCourseId);
    const otherCourses = group.courses.filter((c) => c.id !== group.principalCourseId);

    // The banner comes from the principal course
    const bannerCourse = principal || group.courses[0];

    return (
        <div className="grouped-view">
            {/* Single banner at the top from principal course */}
            {bannerCourse && (bannerCourse.coverDesktop || bannerCourse.coverMobile) && (
                <CourseBanner
                    coverDesktop={bannerCourse.coverDesktop}
                    coverMobile={bannerCourse.coverMobile}
                    courseName={bannerCourse.name}
                />
            )}

            {/* Back button (when user can go back to group selector) */}
            {showBack && onBackToSelector && (
                <div className="grouped-view-back-row">
                    <button
                        className="grouped-view-back-btn"
                        onClick={onBackToSelector}
                        title="Voltar à seleção"
                    >
                        <i className="ri-arrow-left-s-line" />
                    </button>
                </div>
            )}

            {/* Courses listed vertically (Netflix style) — no group name */}
            <div className="grouped-view-courses">
                {/* Principal course first */}
                {principal && principal.hasAccess !== false && (
                    <GroupedCourseRow
                        course={principal}
                        onModuleClick={onModuleClick}
                    />
                )}

                {/* Other courses */}
                {otherCourses.map((course) => (
                    <GroupedCourseRow
                        key={course.id}
                        course={course}
                        onModuleClick={onModuleClick}
                    />
                ))}
            </div>
        </div>
    );
}
