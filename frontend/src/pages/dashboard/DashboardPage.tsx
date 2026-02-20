import { useState, useEffect } from "react";
import { WelcomeHeader } from "./WelcomeHeader";
import {
    StatsOverview,
    QuickActions,
    RecentStudents,
    ActivityFeed,
    StudentsChart,
} from "@/components/dashboard";
import { apiClient } from "@/services/apiClient";

// Mock data — will be replaced with API calls
const mockStudents = [
    {
        id: 1,
        name: "Maria Oliveira",
        email: "maria@email.com",
        joinedAt: "Hoje, 14:32",
        courseName: "Marketing Digital",
    },
    {
        id: 2,
        name: "João Silva",
        email: "joao@email.com",
        joinedAt: "Hoje, 11:20",
        courseName: "Copywriting Avançado",
    },
    {
        id: 3,
        name: "Ana Santos",
        email: "ana@email.com",
        joinedAt: "Ontem, 22:15",
        courseName: "Tráfego Pago",
    },
    {
        id: 4,
        name: "Pedro Costa",
        email: "pedro@email.com",
        joinedAt: "Ontem, 18:40",
        courseName: "Marketing Digital",
    },
    {
        id: 5,
        name: "Carla Mendes",
        email: "carla@email.com",
        joinedAt: "20/02/2026",
        courseName: "Copywriting Avançado",
    },
];

const mockActivities = [
    {
        id: 1,
        type: "student_join" as const,
        description: "Maria Oliveira se cadastrou em Marketing Digital",
        time: "Há 2 horas",
    },
    {
        id: 2,
        type: "lesson_add" as const,
        description: "Nova aula adicionada em Copywriting Avançado",
        time: "Há 4 horas",
    },
    {
        id: 3,
        type: "student_complete" as const,
        description: "João Silva completou o módulo 3",
        time: "Há 6 horas",
    },
    {
        id: 4,
        type: "course_create" as const,
        description: "Novo curso 'Tráfego Pago' criado",
        time: "Ontem",
    },
    {
        id: 5,
        type: "student_join" as const,
        description: "Ana Santos se cadastrou em Tráfego Pago",
        time: "Ontem",
    },
];

interface DashboardStats {
    totalCourses: number;
    totalStudents: number;
    totalLessons: number;
    activeStudents: number;
}

interface DashboardPageProps {
    userName: string;
}

export function DashboardPage({ userName }: DashboardPageProps) {
    const [stats, setStats] = useState<DashboardStats>({
        totalCourses: 0,
        totalStudents: 0,
        totalLessons: 0,
        activeStudents: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const data = await apiClient.get<{
                total_courses: number;
                total_students: number;
                total_lessons: number;
            }>("/admin/dashboard/stats");

            setStats({
                totalCourses: data.total_courses ?? 0,
                totalStudents: data.total_students ?? 0,
                totalLessons: data.total_lessons ?? 0,
                activeStudents: 0,
            });
        } catch {
            // Use default zeros — API may not exist yet
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome */}
            <WelcomeHeader userName={userName} />

            {/* Stats grid */}
            <StatsOverview stats={stats} />

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left — 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <StudentsChart />
                    <ActivityFeed activities={mockActivities} />
                </div>

                {/* Right — 1 col */}
                <div className="space-y-6">
                    <QuickActions />
                    <RecentStudents students={mockStudents} />
                </div>
            </div>
        </div>
    );
}
