import { useState, useEffect, useRef } from "react";
import { memberService } from "@/services/member";
import { MemberHeader, CourseSection, GroupSelectorModal, GroupedCourseView, ShowcaseSection } from "@/components/member";
import { PromotionQueue } from "@/components/member/promotion";
import { ChatBubble } from "@/components/member/chatbot";
import { getContinueWatching } from "@/utils/continueWatching";
import { usePreview } from "@/contexts/PreviewContext";
import { PreviewBanner } from "@/components/member/PreviewBanner";
import { useAutoScrollPastBanner } from "@/hooks/useAutoScrollPastBanner";
import type { MemberCourse, MemberCourseGroup, MemberMenuItem, MemberShowcaseItem, MemberActivePromotion } from "@/types/member";

export function MemberHomePage() {
    const { isPreview } = usePreview();
    const [courses, setCourses] = useState<MemberCourse[]>([]);
    const [groups, setGroups] = useState<MemberCourseGroup[]>([]);
    const [ungrouped, setUngrouped] = useState<MemberCourse[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");
    const [showcases, setShowcases] = useState<MemberShowcaseItem[]>([]);
    const [promotions, setPromotions] = useState<MemberActivePromotion[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [groupedData, profile, showcaseData, promoData] = await Promise.all([
                memberService.getCoursesGrouped(isPreview),
                memberService.getProfile(isPreview),
                memberService.getShowcases(isPreview).catch(() => []),
                memberService.getActivePromotions(isPreview).catch(() => ({ promotions: [] })),
            ]);

            setGroups(groupedData.groups);
            setUngrouped(groupedData.ungrouped);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);
            setShowcases(showcaseData);
            setPromotions(promoData.promotions);

            const allCourses = [
                ...groupedData.groups.flatMap((g) => g.courses),
                ...groupedData.ungrouped,
            ];
            const seen = new Set<number>();
            const deduped = allCourses.filter((c) => {
                if (seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
            });
            setCourses(deduped);

            if (groupedData.groups.length === 1 && groupedData.ungrouped.length === 0) {
                setSelectedGroupId(groupedData.groups[0].id);
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }

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

    // Auto-scroll on mobile when banner covers the full screen
    const courseHeaderRef = useRef<HTMLDivElement>(null);
    const primaryCourseForScroll = courses.find((c) => c.category === "principal");
    useAutoScrollPastBanner(courseHeaderRef, {
        hasMobileCover: !!primaryCourseForScroll?.coverMobile,
    });

    function handleModuleClick(courseId: number, moduleId: number) {
        const course = courses.find((c) => c.id === courseId);
        const mod = course?.modules.find((m) => m.id === moduleId);
        if (!mod || mod.totalLessons === 0) return;

        const previewParam = isPreview ? "preview=true&" : "";

        const saved = getContinueWatching(courseId, moduleId);
        const url = saved
            ? `/member/${courseId}/${moduleId}?${previewParam}lesson=${saved.lessonId}`
            : `/member/${courseId}/${moduleId}${isPreview ? "?preview=true" : ""}`;
        window.location.href = url;
    }

    if (loading) {
        return <MemberLoadingSkeleton />;
    }

    if (!courses.length) {
        return (
            <div className="member-page dark">
                {isPreview && <PreviewBanner />}
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
                <ChatBubble />
            </div>
        );
    }

    if (showGroupSelector) {
        return (
            <div className="member-page dark">
                {isPreview && <PreviewBanner />}
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
                {promotions.length > 0 && <PromotionQueue promotions={promotions} />}
                <ChatBubble />
            </div>
        );
    }

    if (selectedGroup) {
        return (
            <div className="member-page dark">
                {isPreview && <PreviewBanner />}
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

                    {ungrouped.map((course) => (
                        <CourseSection
                            key={course.id}
                            course={course}
                            onModuleClick={handleModuleClick}
                        />
                    ))}

                    <ShowcaseSection showcases={showcases} />
                </main>
                <footer className="member-footer">
                    <p>{platformName} · Todos os direitos reservados</p>
                </footer>
                {promotions.length > 0 && <PromotionQueue promotions={promotions} />}
                <ChatBubble />
            </div>
        );
    }

    const primaryCourse = courses.find((c) => c.category === "principal");
    const secondaryCourses = courses.filter((c) => c.category !== "principal");

    return (
        <div className="member-page dark">
            {isPreview && <PreviewBanner />}
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
                        courseHeaderRef={courseHeaderRef}
                    />
                )}

                {secondaryCourses.map((course) => (
                    <CourseSection
                        key={course.id}
                        course={course}
                        onModuleClick={handleModuleClick}
                    />
                ))}

                <ShowcaseSection showcases={showcases} />
            </main>

            <footer className="member-footer">
                <p>{platformName} · Todos os direitos reservados</p>
            </footer>
            {promotions.length > 0 && <PromotionQueue promotions={promotions} />}
            <ChatBubble />
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
