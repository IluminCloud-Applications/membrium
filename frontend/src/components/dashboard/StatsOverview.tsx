import { StatCard } from "./StatCard";

interface StatsOverviewProps {
    stats: {
        totalCourses: number;
        totalStudents: number;
        totalLessons: number;
        activeStudents: number;
    };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total de Cursos"
                value={stats.totalCourses}
                icon="ri-book-open-line"
                description="Cursos publicados"
            />
            <StatCard
                title="Total de Alunos"
                value={stats.totalStudents}
                icon="ri-group-line"
                description="Alunos cadastrados"
                trend={{ value: "+12%", positive: true }}
            />
            <StatCard
                title="Total de Aulas"
                value={stats.totalLessons}
                icon="ri-play-circle-line"
                description="Aulas adicionadas"
            />
            <StatCard
                title="Alunos Ativos"
                value={stats.activeStudents}
                icon="ri-user-heart-line"
                description="Últimas 24h"
                trend={{ value: "+5%", positive: true }}
            />
        </div>
    );
}
