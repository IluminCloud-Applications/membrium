import { useState, useEffect } from "react";
import { WelcomeHeader } from "./WelcomeHeader";
import {
    StatsOverview,
    QuickActions,
    RecentStudents,
    StudentsChart,
} from "@/components/dashboard";
import {
    dashboardService,
    type RecentStudent,
    type CourseStudentData,
} from "@/services/dashboard";

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
    const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
    const [courseStudents, setCourseStudents] = useState<CourseStudentData[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const [statsData, studentsData, chartData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRecentStudents(),
                dashboardService.getCourseStudents(),
            ]);

            setStats({
                totalCourses: statsData.total_courses ?? 0,
                totalStudents: statsData.total_students ?? 0,
                totalLessons: statsData.total_lessons ?? 0,
                activeStudents: statsData.active_students ?? 0,
            });

            setRecentStudents(studentsData.students ?? []);
            setCourseStudents(chartData.courses ?? []);
        } catch {
            // Use default zeros — API may not be ready
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
                    <StudentsChart courses={courseStudents} />
                </div>

                {/* Right — 1 col */}
                <div className="space-y-6">
                    <QuickActions />
                    <RecentStudents students={recentStudents} />
                </div>
            </div>
        </div>
    );
}
