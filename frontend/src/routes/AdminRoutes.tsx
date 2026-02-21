import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { CoursesPage } from "@/pages/courses";
import { StudentsPage } from "@/pages/students";
import { ShowcasePage } from "@/pages/showcase";
import { PromotePage } from "@/pages/promote";
import { FilesPage } from "@/pages/files";
import { TranscriptsPage } from "@/pages/transcripts";
import { FAQPage } from "@/pages/faq";
import { SettingsGeneralPage, IntegrationsPage, AIPage } from "@/pages/settings";
import { CourseModificationPage } from "@/pages/course_modification";
import { dashboardService, type UserInfo } from "@/services/dashboard";

interface AdminRoutesProps {
    platformName: string;
}

/**
 * Admin routes wrapped with the sidebar layout.
 * Fetches real user info from the API for sidebar and dashboard.
 */
export function AdminRoutes({ platformName }: AdminRoutesProps) {
    const [user, setUser] = useState({ name: "Admin", email: "" });

    useEffect(() => {
        loadUserInfo();
    }, []);

    async function loadUserInfo() {
        try {
            const data: UserInfo = await dashboardService.getUserInfo();
            setUser({
                name: data.name,
                email: data.email,
            });
        } catch {
            // Fallback to defaults
        }
    }

    return (
        <Routes>
            <Route
                element={
                    <AdminLayout
                        platformName={platformName}
                        user={user}
                        pageTitle=""
                    />
                }
            >
                <Route index element={<DashboardPage userName={user.name} />} />

                <Route path="cursos" element={<CoursesPage />} />
                <Route path="course/:id/modification" element={<CourseModificationPage />} />
                <Route path="alunos" element={<StudentsPage />} />
                <Route path="vitrine" element={<ShowcasePage />} />
                <Route path="promocoes" element={<PromotePage />} />
                <Route path="faq" element={<FAQPage />} />
                <Route path="transcricoes" element={<TranscriptsPage />} />
                <Route path="arquivos" element={<FilesPage />} />

                {/* Settings */}
                <Route path="configuracoes" element={<SettingsGeneralPage />} />
                <Route path="configuracoes/integracoes" element={<IntegrationsPage />} />
                <Route path="configuracoes/ia" element={<AIPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}
