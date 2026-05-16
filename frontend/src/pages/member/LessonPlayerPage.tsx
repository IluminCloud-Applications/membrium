import { useState, useEffect } from "react";
import { useLessonPage } from "@/hooks/useLessonPage";
import { memberService } from "@/services/member";
import { ChatWidget } from "@/components/member/chatbot";
import { PreviewBanner } from "@/components/member/PreviewBanner";
import { usePreview } from "@/contexts/PreviewContext";
import { customizationService } from "@/services/customization";
import {
    VideoPlayer,
    LessonSidebar,
    LessonContent,
    LessonNavBar,
    LessonCTA,
    LessonMiniSidebar,
    LessonModulesDrawer,
    LessonMobileNav,
} from "@/components/member/lesson";
import { MemberHeader } from "@/components/member";
import type { MemberShowcaseItem } from "@/types/member";

export function LessonPlayerPage() {
    const {
        loading,
        error,
        courseName,
        courseId,
        moduleId,
        moduleName,
        menuItems,
        lessons,
        currentLesson,
        totalLessons,
        completedLessons,
        completing,
        ctaVisible,
        studentName,
        platformName,
        initialVideoTime,
        courseModules,
        selectLesson,
        goToPrevious,
        goToNext,
        toggleComplete,
        handleVideoTime,
    } = useLessonPage();

    const { isPreview } = usePreview();
    const [showcases, setShowcases] = useState<MemberShowcaseItem[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        memberService.getShowcases(isPreview).then(setShowcases).catch(() => { });
        customizationService.getMemberConfig()
            .then((d) => injectMemberCss(d.member_custom_css || ""))
            .catch(() => {});
        return () => { document.getElementById("member-custom-css")?.remove(); };
    }, []);


    if (loading) return <LessonSkeleton />;

    if (error) {
        return (
            <div className="member-page dark">
                <MemberHeader
                    platformName={platformName}
                    studentName={studentName || "Aluno"}
                    menuItems={[]}
                />
                <div className="lesson-error-page">
                    <i className="ri-error-warning-line" />
                    <h2>Erro ao carregar</h2>
                    <p>{error}</p>
                    <a href="/member" className="lesson-back-link">
                        <i className="ri-arrow-left-line" />
                        Voltar para o início
                    </a>
                </div>
            </div>
        );
    }

    if (!currentLesson) return null;

    return (
        <div className="lesson-fullscreen dark">
            {isPreview && <PreviewBanner />}

            {/* Root layout: mini-sidebar | main area */}
            <div className="lesson-root-layout">

                {/* Left mini icon sidebar */}
                <LessonMiniSidebar
                    studentName={studentName}
                    menuItems={menuItems}
                />

                {/* Main content + right sidebar */}
                <div className="lesson-content-wrapper">

                    {/* Breadcrumb bar */}
                    <div className="lesson-breadcrumb-bar">
                        <div className="lesson-breadcrumb-trail">
                            <a href="/member" className="lesson-breadcrumb-course">{courseName}</a>
                            <i className="ri-arrow-right-s-line" />
                            <span className="lesson-breadcrumb-module">{moduleName}</span>
                            <i className="ri-arrow-right-s-line" />
                            <span className="lesson-breadcrumb-lesson">{currentLesson.title}</span>
                        </div>
                    </div>

                    {/* Video + content + right module sidebar */}
                    <main className="lesson-page-layout">
                        {/* Main content area */}
                        <div className="lesson-main-col">
                            {/* Video Player */}
                            {currentLesson.videoUrl && (
                                <VideoPlayer
                                    title={currentLesson.title}
                                    src={currentLesson.videoUrl}
                                    videoType={currentLesson.videoType}
                                    lessonId={currentLesson.id}
                                    hasNextLesson={lessons.findIndex((l) => l.id === currentLesson.id) < lessons.length - 1}
                                    initialTime={initialVideoTime}
                                    onNextLesson={goToNext}
                                    onTimeUpdate={handleVideoTime}
                                />
                            )}

                            {/* CTA Button */}
                            {currentLesson.hasButton && currentLesson.buttonText && currentLesson.buttonLink && (
                                <LessonCTA
                                    visible={ctaVisible || !currentLesson.buttonDelay}
                                    text={currentLesson.buttonText}
                                    link={currentLesson.buttonLink}
                                />
                            )}

                            {/* Nav bar (prev/next + complete) */}
                            <LessonNavBar
                                lesson={currentLesson}
                                lessons={lessons}
                                onPrevious={goToPrevious}
                                onNext={goToNext}
                                onToggleComplete={toggleComplete}
                                completing={completing}
                            />

                            {/* Lesson Title */}
                            <div className="lesson-title-section">
                                <h1 className="lesson-title">{currentLesson.title}</h1>
                            </div>

                            {/* Description, FAQ, Documents */}
                            <LessonContent lesson={currentLesson} />
                        </div>

                        {/* Sidebar */}
                        <LessonSidebar
                            lessons={lessons}
                            currentLessonId={currentLesson.id}
                            moduleName={moduleName}
                            totalLessons={totalLessons}
                            completedLessons={completedLessons}
                            onSelectLesson={selectLesson}
                            showcases={showcases}
                            courseModules={courseModules}
                            courseId={courseId}
                            currentModuleId={moduleId}
                        />
                    </main>

                    <footer className="member-footer">
                        <p>{platformName} · Todos os direitos reservados</p>
                    </footer>
                </div>
            </div>

            {/* Modules drawer (mobile) */}
            <LessonModulesDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                lessons={lessons}
                currentLessonId={currentLesson.id}
                courseModules={courseModules}
                courseId={courseId}
                currentModuleId={moduleId}
                onSelectLesson={(id) => { selectLesson(id); setDrawerOpen(false); }}
                moduleName={moduleName}
            />

            {/* Lesson-specific mobile bottom nav */}
            <LessonMobileNav
                onOpenModules={() => setDrawerOpen(true)}
                onPrevious={goToPrevious}
                onNext={goToNext}
                hasPrevious={lessons.findIndex((l) => l.id === currentLesson.id) > 0}
                hasNext={lessons.findIndex((l) => l.id === currentLesson.id) < lessons.length - 1}
            />

            <ChatWidget />
        </div>
    );
}

function LessonSkeleton() {
    return (
        <div className="lesson-fullscreen dark">
            <div className="lesson-root-layout">
                <div className="lesson-mini-sidebar">
                    <div className="skeleton-circle" style={{ width: 36, height: 36 }} />
                </div>
                <div className="lesson-content-wrapper">
                    <div className="lesson-page-layout">
                        <div className="lesson-main-col">
                            <div className="lesson-video-skeleton" />
                            <div className="skeleton-text" style={{ width: "60%", height: 28, marginTop: 20 }} />
                            <div className="skeleton-text" style={{ width: "100%", height: 120, marginTop: 16 }} />
                        </div>
                        <div className="lesson-sidebar-skeleton">
                            <div className="skeleton-text" style={{ width: "80%", height: 20, marginBottom: 16 }} />
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton-text" style={{ width: "100%", height: 48, marginBottom: 8 }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function injectMemberCss(css: string) {
    const id = "member-custom-css";
    document.getElementById(id)?.remove();
    if (!css.trim()) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
