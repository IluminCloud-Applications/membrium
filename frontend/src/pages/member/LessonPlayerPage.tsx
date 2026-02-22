import { useLessonPage } from "@/hooks/useLessonPage";
import { MemberHeader } from "@/components/member";
import { ChatBubble } from "@/components/member/chatbot";
import {
    VideoPlayer,
    LessonSidebar,
    LessonContent,
    LessonNavBar,
    LessonCTA,
} from "@/components/member/lesson";

export function LessonPlayerPage() {
    const {
        loading,
        error,
        courseName,
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
        selectLesson,
        goToPrevious,
        goToNext,
        toggleComplete,
        handleVideoTime,
    } = useLessonPage();

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
        <div className="member-page dark">
            <MemberHeader
                platformName={platformName}
                studentName={studentName}
                menuItems={menuItems}
            />

            {/* Top bar - breadcrumb */}
            <div className="lesson-breadcrumb-bar">
                <a href="/member" className="lesson-breadcrumb-link">
                    <i className="ri-arrow-left-s-line" />
                    Voltar para Módulos
                </a>
                <div className="lesson-breadcrumb-trail">
                    <span>{courseName}</span>
                    <i className="ri-arrow-right-s-line" />
                    <span>{moduleName}</span>
                </div>
            </div>

            <main className="lesson-page-layout">
                {/* Main content area */}
                <div className="lesson-main-col">
                    {/* Video Player */}
                    {currentLesson.videoUrl && (
                        <VideoPlayer
                            title={currentLesson.title}
                            src={currentLesson.videoUrl}
                            videoType={currentLesson.videoType}
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
                />
            </main>

            <footer className="member-footer">
                <p>{platformName} · Todos os direitos reservados</p>
            </footer>
            <ChatBubble />
        </div>
    );
}

function LessonSkeleton() {
    return (
        <div className="member-page dark">
            <div className="member-header">
                <div className="member-header-inner">
                    <div className="skeleton-text" style={{ width: 120, height: 24 }} />
                    <div className="skeleton-circle" style={{ width: 36, height: 36 }} />
                </div>
            </div>
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
    );
}
