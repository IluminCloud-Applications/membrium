import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { memberService } from "@/services/member";
import { getContinueWatching, saveContinueWatching } from "@/utils/continueWatching";
import type {
    MemberLessonDetail,
    MemberModuleLessonsResponse,
    MemberMenuItem,
    MemberModuleDetail,
} from "@/types/member";

interface UseLessonPageReturn {
    loading: boolean;
    error: string | null;
    courseName: string;
    courseId: number;
    moduleId: number;
    moduleName: string;
    menuItems: MemberMenuItem[];
    lessons: MemberLessonDetail[];
    currentLesson: MemberLessonDetail | null;
    totalLessons: number;
    completedLessons: number;
    completing: boolean;
    ctaVisible: boolean;
    studentName: string;
    platformName: string;
    initialVideoTime: number;
    courseModules: MemberModuleDetail[];
    selectLesson: (lessonId: number) => void;
    goToPrevious: () => void;
    goToNext: () => void;
    toggleComplete: () => void;
    handleVideoTime: (time: number, duration: number) => void;
}

export function useLessonPage(): UseLessonPageReturn {
    const { courseId: courseIdParam, moduleId: moduleIdParam } = useParams<{
        courseId: string;
        moduleId: string;
    }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const courseId = Number(courseIdParam);
    const moduleId = Number(moduleIdParam);

    const [data, setData] = useState<MemberModuleLessonsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
    const [completing, setCompleting] = useState(false);
    const [ctaVisible, setCTAVisible] = useState(false);
    const [ctaTriggered, setCTATriggered] = useState(false);
    const autoCompletedRef = useRef(false);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");
    const [initialVideoTime, setInitialVideoTime] = useState(0);
    const [courseModules, setCourseModules] = useState<MemberModuleDetail[]>([]);
    const lastSaveRef = useRef(0);
    const currentVideoTimeRef = useRef(0);

    useEffect(() => {
        loadData();
    }, [courseId, moduleId]);

    async function loadData() {
        setLoading(true);
        setError(null);
        setCTAVisible(false);
        setCTATriggered(false);
        try {
            const [moduleData, profile, courseDetail] = await Promise.all([
                memberService.getModuleLessons(courseId, moduleId),
                memberService.getProfile(),
                memberService.getCourseDetail(courseId).catch(() => null),
            ]);
            setData(moduleData);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);
            if (courseDetail?.modules) {
                setCourseModules(courseDetail.modules);
            }

            // Check for lesson query param to select specific lesson
            const lessonParam = searchParams.get("lesson");
            const lessonIdFromParam = lessonParam ? Number(lessonParam) : null;

            if (lessonIdFromParam && moduleData.lessons.some((l) => l.id === lessonIdFromParam)) {
                setCurrentLessonId(lessonIdFromParam);
                setSearchParams({}, { replace: true });
            } else {
                // Try to restore from "continue watching"
                const saved = getContinueWatching(courseId, moduleId);
                if (saved && moduleData.lessons.some((l) => l.id === saved.lessonId)) {
                    setCurrentLessonId(saved.lessonId);
                    setInitialVideoTime(saved.videoTime);
                } else if (moduleData.lessons.length > 0) {
                    setCurrentLessonId(moduleData.lessons[0].id);
                }
            }
        } catch (err) {
            console.error("Erro ao carregar módulo:", err);
            setError("Não foi possível carregar as aulas.");
        } finally {
            setLoading(false);
        }
    }

    const currentLesson = data?.lessons.find((l) => l.id === currentLessonId) ?? null;

    const selectLesson = useCallback((lessonId: number) => {
        setCurrentLessonId(lessonId);
        setCTAVisible(false);
        setCTATriggered(false);
        autoCompletedRef.current = false;
        setInitialVideoTime(0);
        currentVideoTimeRef.current = 0;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const goToPrevious = useCallback(() => {
        if (!data || !currentLesson) return;
        const idx = data.lessons.findIndex((l) => l.id === currentLesson.id);
        if (idx > 0) selectLesson(data.lessons[idx - 1].id);
    }, [data, currentLesson, selectLesson]);

    const goToNext = useCallback(() => {
        if (!data || !currentLesson) return;
        const idx = data.lessons.findIndex((l) => l.id === currentLesson.id);
        if (idx < data.lessons.length - 1) selectLesson(data.lessons[idx + 1].id);
    }, [data, currentLesson, selectLesson]);

    /** Mark/unmark the current lesson as complete (updates local + API). */
    const markLessonComplete = useCallback(async (lessonId: number, markComplete: boolean) => {
        setCompleting(true);
        try {
            if (markComplete) {
                await memberService.completeLesson(lessonId);
            } else {
                await memberService.uncompleteLesson(lessonId);
            }

            setData((prev) => {
                if (!prev) return prev;
                const updatedLessons = prev.lessons.map((l) =>
                    l.id === lessonId ? { ...l, completed: markComplete } : l
                );
                const completedCount = updatedLessons.filter((l) => l.completed).length;
                return { ...prev, lessons: updatedLessons, completedLessons: completedCount };
            });
        } catch (err) {
            console.error("Erro ao atualizar progresso:", err);
        } finally {
            setCompleting(false);
        }
    }, []);

    const toggleComplete = useCallback(async () => {
        if (!currentLesson) return;
        await markLessonComplete(currentLesson.id, !currentLesson.completed);
    }, [currentLesson, markLessonComplete]);

    const handleVideoTime = useCallback(
        (time: number, duration: number) => {
            currentVideoTimeRef.current = time;

            // CTA trigger
            if (
                !ctaTriggered &&
                currentLesson?.hasButton &&
                currentLesson.buttonDelay &&
                time >= currentLesson.buttonDelay
            ) {
                setCTAVisible(true);
                setCTATriggered(true);
            }

            // Auto-complete at 90%
            if (
                duration > 0 &&
                time / duration >= 0.9 &&
                currentLesson &&
                !currentLesson.completed &&
                !autoCompletedRef.current
            ) {
                autoCompletedRef.current = true;
                markLessonComplete(currentLesson.id, true);
            }

            // Save continue-watching every 10 seconds
            const now = Date.now();
            if (now - lastSaveRef.current >= 10_000 && currentLesson) {
                lastSaveRef.current = now;
                saveContinueWatching(courseId, moduleId, currentLesson.id, time);
            }
        },
        [currentLesson, ctaTriggered, markLessonComplete, courseId, moduleId]
    );

    // Save on unmount (leaving the page)
    useEffect(() => {
        return () => {
            if (currentLessonId && currentVideoTimeRef.current > 0) {
                saveContinueWatching(courseId, moduleId, currentLessonId, currentVideoTimeRef.current);
            }
        };
    }, [courseId, moduleId, currentLessonId]);

    return {
        loading,
        error,
        courseName: data?.course.name ?? "",
        courseId,
        moduleId,
        moduleName: data?.module.name ?? "",
        menuItems: data?.course.menuItems ?? [],
        lessons: data?.lessons ?? [],
        currentLesson,
        totalLessons: data?.totalLessons ?? 0,
        completedLessons: data?.completedLessons ?? 0,
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
    };
}
