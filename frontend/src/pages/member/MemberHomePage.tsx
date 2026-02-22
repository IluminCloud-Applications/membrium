import { useState, useEffect } from "react";
import { memberService } from "@/services/member";
import { MemberHeader, CourseSection } from "@/components/member";
import type { MemberCourse, MemberMenuItem } from "@/types/member";

export function MemberHomePage() {
    const [courses, setCourses] = useState<MemberCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [coursesData, profile] = await Promise.all([
                memberService.getCourses(),
                memberService.getProfile(),
            ]);
            setCourses(coursesData);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }

    // Aggregate all menu items from all courses (dedup by name)
    const allMenuItems = courses.reduce<MemberMenuItem[]>((acc, course) => {
        course.menuItems.forEach((item) => {
            if (!acc.find((a) => a.name === item.name)) acc.push(item);
        });
        return acc;
    }, []);

    // Separate primary and bonus/secondary courses
    const primaryCourse = courses.find((c) => c.category === "principal");
    const secondaryCourses = courses.filter((c) => c.category !== "principal");

    function handleModuleClick(courseId: number, _moduleId: number) {
        // For now, navigate to course detail (future: lesson player)
        window.location.href = `/member/curso/${courseId}`;
    }

    if (loading) {
        return <MemberLoadingSkeleton />;
    }

    if (!courses.length) {
        return (
            <div className="member-page">
                <MemberHeader
                    platformName={platformName}
                    studentName={studentName || "Aluno"}
                    menuItems={[]}
                />
                <div className="member-empty-page">
                    <i className="ri-video-line" />
                    <h2>Nenhum curso disponível</h2>
                    <p>Você ainda não possui acesso a nenhum curso.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`member-page ${primaryCourse?.theme === "dark" ? "dark" : ""}`}>
            <MemberHeader
                platformName={platformName}
                studentName={studentName}
                menuItems={allMenuItems}
            />

            <main className="member-main">
                {/* Primary course */}
                {primaryCourse && (
                    <CourseSection
                        course={primaryCourse}
                        isPrimary
                        onModuleClick={handleModuleClick}
                    />
                )}

                {/* Secondary courses (bonus, order bumps, etc.) */}
                {secondaryCourses.map((course) => (
                    <CourseSection
                        key={course.id}
                        course={course}
                        onModuleClick={handleModuleClick}
                    />
                ))}
            </main>

            <footer className="member-footer">
                <p>{platformName} · Todos os direitos reservados</p>
            </footer>
        </div>
    );
}


function MemberLoadingSkeleton() {
    return (
        <div className="member-page dark">
            <div className="member-header">
                <div className="member-header-inner">
                    <div className="skeleton-text" style={{ width: 120, height: 24 }} />
                    <div className="skeleton-circle" style={{ width: 36, height: 36 }} />
                </div>
            </div>
            <div className="member-banner-skeleton" />
            <div className="member-content" style={{ padding: "2rem" }}>
                <div className="skeleton-text" style={{ width: 300, height: 32, marginBottom: 24 }} />
                <div className="member-module-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="member-module-skeleton" />
                    ))}
                </div>
            </div>
        </div>
    );
}
