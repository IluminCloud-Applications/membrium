import { useState, useEffect } from "react";
import { memberService } from "@/services/member";
import { MemberHeader, CourseSection, GroupSelectorModal, GroupedCourseView } from "@/components/member";
import type { MemberCourse, MemberCourseGroup, MemberMenuItem } from "@/types/member";

export function MemberHomePage() {
    const [courses, setCourses] = useState<MemberCourse[]>([]);
    const [groups, setGroups] = useState<MemberCourseGroup[]>([]);
    const [ungrouped, setUngrouped] = useState<MemberCourse[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [groupedData, profile] = await Promise.all([
                memberService.getCoursesGrouped(),
                memberService.getProfile(),
            ]);

            setGroups(groupedData.groups);
            setUngrouped(groupedData.ungrouped);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);

            // Build flat course list for fallback/header
            const allCourses = [
                ...groupedData.groups.flatMap((g) => g.courses),
                ...groupedData.ungrouped,
            ];
            // Dedup by ID
            const seen = new Set<number>();
            const deduped = allCourses.filter((c) => {
                if (seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
            });
            setCourses(deduped);

            // Auto-select if only 1 group and no ungrouped
            if (groupedData.groups.length === 1 && groupedData.ungrouped.length === 0) {
                setSelectedGroupId(groupedData.groups[0].id);
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }

    // Aggregate all menu items from courses (dedup by name)
    const allMenuItems = courses.reduce<MemberMenuItem[]>((acc, course) => {
        if (course.menuItems) {
            course.menuItems.forEach((item) => {
                if (!acc.find((a) => a.name === item.name)) acc.push(item);
            });
        }
        return acc;
    }, []);

    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    const hasGroups = groups.length > 0;
    const showGroupSelector = hasGroups && !selectedGroupId && groups.length > 1;

    // Determine theme from selected group or primary course
    const activeTheme = selectedGroup
        ? selectedGroup.courses.find((c) => c.id === selectedGroup.principalCourseId)?.theme
        : courses.find((c) => c.category === "principal")?.theme;

    function handleModuleClick(courseId: number, moduleId: number) {
        const course = courses.find((c) => c.id === courseId);
        const mod = course?.modules.find((m) => m.id === moduleId);
        if (!mod || mod.totalLessons === 0) return;
        window.location.href = `/member/${courseId}/${moduleId}`;
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

    // --- GROUP SELECTOR: multiple groups, none selected ---
    if (showGroupSelector) {
        return (
            <div className={`member-page ${activeTheme === "dark" ? "dark" : ""}`}>
                <MemberHeader
                    platformName={platformName}
                    studentName={studentName}
                    menuItems={allMenuItems}
                />
                <GroupSelectorModal
                    groups={groups}
                    onSelect={setSelectedGroupId}
                    platformName={platformName}
                />
            </div>
        );
    }

    // --- GROUPED VIEW: 1 group selected or auto-selected ---
    if (selectedGroup) {
        return (
            <div className={`member-page ${activeTheme === "dark" ? "dark" : ""}`}>
                <MemberHeader
                    platformName={platformName}
                    studentName={studentName}
                    menuItems={allMenuItems}
                />
                <main className="member-main">
                    <GroupedCourseView
                        group={selectedGroup}
                        onModuleClick={handleModuleClick}
                        onBackToSelector={groups.length > 1 ? () => setSelectedGroupId(null) : undefined}
                        showBack={groups.length > 1}
                    />

                    {/* Show ungrouped courses below */}
                    {ungrouped.map((course) => (
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

    // --- NO GROUPS: Original behavior (all courses individually) ---
    const primaryCourse = courses.find((c) => c.category === "principal");
    const secondaryCourses = courses.filter((c) => c.category !== "principal");

    return (
        <div className={`member-page ${primaryCourse?.theme === "dark" ? "dark" : ""}`}>
            <MemberHeader
                platformName={platformName}
                studentName={studentName}
                menuItems={allMenuItems}
            />

            <main className="member-main">
                {primaryCourse && (
                    <CourseSection
                        course={primaryCourse}
                        isPrimary
                        onModuleClick={handleModuleClick}
                    />
                )}

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
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 1.5rem" }}>
                <div className="skeleton-text" style={{ width: 300, height: 32, marginBottom: 24 }} />
                <div style={{ display: "flex", gap: "1.1rem", overflow: "hidden" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="member-module-skeleton" />
                    ))}
                </div>
            </div>
        </div>
    );
}
