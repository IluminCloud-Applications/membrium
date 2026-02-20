import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout";
import { DashboardPage } from "@/pages/dashboard";
import { CoursesPage } from "@/pages/courses";

interface AdminRoutesProps {
    platformName: string;
}

/**
 * Admin routes wrapped with the sidebar layout.
 * Each route renders inside the AdminLayout <Outlet>.
 *
 * TODO: Replace mock user with real session data
 */
export function AdminRoutes({ platformName }: AdminRoutesProps) {
    // TODO: Get from auth context/session
    const user = { name: "Admin", email: "admin@email.com" };

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

                {/* Future routes — placeholder */}
                <Route path="cursos" element={<CoursesPage />} />
                <Route path="alunos" element={<PlaceholderPage title="Alunos" />} />
                <Route path="vitrine" element={<PlaceholderPage title="Vitrine" />} />
                <Route path="promocoes" element={<PlaceholderPage title="Promoções" />} />
                <Route path="faq" element={<PlaceholderPage title="FAQ" />} />
                <Route path="transcricoes" element={<PlaceholderPage title="Transcrições" />} />
                <Route path="arquivos" element={<PlaceholderPage title="Arquivos" />} />
                <Route path="configuracoes" element={<PlaceholderPage title="Configurações" />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}

/** Temporary placeholder for pages not yet implemented */
function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-muted/30 min-h-[60vh]">
            <div className="text-center space-y-2">
                <i className="ri-tools-line text-4xl text-muted-foreground" />
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">
                    Esta página será implementada em breve.
                </p>
            </div>
        </div>
    );
}
