import { useState, useEffect, useRef } from "react";
import { memberService } from "@/services/member";
import { MemberHeader, CourseSection, ShowcaseSection } from "@/components/member";
import { PromotionQueue } from "@/components/member/promotion";
import { EventQueue } from "@/components/member/events/EventQueue";
import { ChatWidget } from "@/components/member/chatbot";
import { getContinueWatching } from "@/utils/continueWatching";
import { usePreview } from "@/contexts/PreviewContext";
import { PreviewBanner } from "@/components/member/PreviewBanner";
import { useAutoScrollPastBanner } from "@/hooks/useAutoScrollPastBanner";
import { customizationService, type MemberAreaConfig } from "@/services/customization";
import type { MemberCourse, MemberShowcaseItem, MemberActivePromotion, MemberActiveEvent } from "@/types/member";

export function MemberHomePage() {
    const { isPreview } = usePreview();
    const [courses, setCourses] = useState<MemberCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");
    const [showcases, setShowcases] = useState<MemberShowcaseItem[]>([]);
    const [promotions, setPromotions] = useState<MemberActivePromotion[]>([]);
    const [events, setEvents] = useState<MemberActiveEvent[]>([]);
    const [config, setConfig] = useState<MemberAreaConfig | null>(null);

    useEffect(() => {
        loadData();
        customizationService.getMemberConfig()
            .then((d) => {
                setConfig(d);
                injectMemberCss(d.member_custom_css || "");
            })
            .catch(() => {});
    }, []);

    async function loadData() {
        try {
            const [coursesData, profile, showcaseData, promoData, eventData] = await Promise.all([
                memberService.getCourses(isPreview),
                memberService.getProfile(isPreview),
                memberService.getShowcases(isPreview).catch(() => []),
                memberService.getActivePromotions(isPreview).catch(() => ({ promotions: [] })),
                memberService.getActiveEvents(isPreview).catch(() => ({ events: [] })),
            ]);

            setCourses(coursesData);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);
            setShowcases(showcaseData);
            setPromotions(promoData.promotions);
            setEvents(eventData.events);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }

    // Global menu: same for all courses — take from first accessible course
    const allMenuItems = courses.find((c) => c.hasAccess !== false)?.menuItems ?? [];

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

    const hideModuleInfo = config?.hide_module_info || false;

    if (loading) {
        return <MemberLoadingSkeleton />;
    }

    const accessibleCourses = courses.filter((c) => c.hasAccess !== false);

    if (!accessibleCourses.length) {
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
                <ChatWidget />
            </div>
        );
    }

    const primaryCourse = courses.find((c) => c.category === "principal" && c.hasAccess !== false);
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
                        hideModuleInfo={hideModuleInfo}
                    />
                )}

                {secondaryCourses.map((course) => (
                    <CourseSection
                        key={course.id}
                        course={course}
                        onModuleClick={handleModuleClick}
                        hideModuleInfo={hideModuleInfo}
                    />
                ))}

                <ShowcaseSection showcases={showcases} />
            </main>

            <footer className="member-footer">
                <p>{platformName} · Todos os direitos reservados</p>
            </footer>
            {promotions.length > 0 && <PromotionQueue promotions={promotions} />}
            {events.length > 0 && <EventQueue events={events} />}
            <ChatWidget />
        </div>
    );
}

/** Injects (or replaces) the member custom CSS <style> tag in <head>. */
function injectMemberCss(css: string) {
    const id = "member-custom-css";
    document.getElementById(id)?.remove();
    if (!css.trim()) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
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
