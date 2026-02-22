import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { memberService } from "@/services/member";
import type {
    MemberLessonDetail,
    MemberModuleLessonsResponse,
    MemberMenuItem,
} from "@/types/member";

interface UseLessonPageReturn {
    loading: boolean;
    error: string | null;
    courseName: string;
    courseId: number;
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
    selectLesson: (lessonId: number) => void;
    goToPrevious: () => void;
    goToNext: () => void;
    toggleComplete: () => void;
    handleVideoTime: (time: number) => void;
}

export function useLessonPage(): UseLessonPageReturn {
    const { courseId: courseIdParam, moduleId: moduleIdParam } = useParams<{
        courseId: string;
        moduleId: string;
    }>();

    const courseId = Number(courseIdParam);
    const moduleId = Number(moduleIdParam);

    const [data, setData] = useState<MemberModuleLessonsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
    const [completing, setCompleting] = useState(false);
    const [ctaVisible, setCTAVisible] = useState(false);
    const [ctaTriggered, setCTATriggered] = useState(false);
    const [studentName, setStudentName] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");

    useEffect(() => {
        loadData();
    }, [courseId, moduleId]);

    async function loadData() {
        setLoading(true);
        setError(null);
        setCTAVisible(false);
        setCTATriggered(false);
        try {
            const [moduleData, profile] = await Promise.all([
                memberService.getModuleLessons(courseId, moduleId),
                memberService.getProfile(),
            ]);
            setData(moduleData);
            setStudentName(profile.name);
            setPlatformName(profile.platformName);

            // Select first lesson by default
            if (moduleData.lessons.length > 0) {
                setCurrentLessonId(moduleData.lessons[0].id);
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

    const toggleComplete = useCallback(async () => {
        if (!currentLesson || !data) return;
        setCompleting(true);
        try {
            if (currentLesson.completed) {
                await memberService.uncompleteLesson(currentLesson.id);
            } else {
                await memberService.completeLesson(currentLesson.id);
            }

            // Update local state
            setData((prev) => {
                if (!prev) return prev;
                const updatedLessons = prev.lessons.map((l) =>
                    l.id === currentLesson.id
                        ? { ...l, completed: !l.completed }
                        : l
                );
                const completedCount = updatedLessons.filter((l) => l.completed).length;
                return {
                    ...prev,
                    lessons: updatedLessons,
                    completedLessons: completedCount,
                };
            });
        } catch (err) {
            console.error("Erro ao atualizar progresso:", err);
        } finally {
            setCompleting(false);
        }
    }, [currentLesson, data]);

    const handleVideoTime = useCallback(
        (time: number) => {
            if (
                !ctaTriggered &&
                currentLesson?.hasButton &&
                currentLesson.buttonDelay &&
                time >= currentLesson.buttonDelay
            ) {
                setCTAVisible(true);
                setCTATriggered(true);
            }
        },
        [currentLesson, ctaTriggered]
    );

    return {
        loading,
        error,
        courseName: data?.course.name ?? "",
        courseId,
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
        selectLesson,
        goToPrevious,
        goToNext,
        toggleComplete,
        handleVideoTime,
    };
}
