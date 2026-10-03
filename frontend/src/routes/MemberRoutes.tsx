import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { MemberHomePage, MemberProfilePage, LessonPlayerPage } from "@/pages/member";
import { PreviewProvider } from "@/contexts/PreviewContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Student member area routes.
 * Mounted at /member/*
 *
 * Supports ?preview=true or admin session for admin preview mode.
 *
 * NOTE: Authentication is handled by ProtectedRoute in App.tsx.
 */
export function MemberRoutes() {
    const [searchParams] = useSearchParams();
    const { userType } = useAuth();
    const isPreview = searchParams.get("preview") === "true" || userType === "admin";

    return (
        <PreviewProvider isPreview={isPreview}>
            <Routes>
                <Route index element={<MemberHomePage />} />
                <Route path="perfil" element={<MemberProfilePage />} />
                <Route path=":courseId/:moduleId" element={<LessonPlayerPage />} />
                <Route path="*" element={<Navigate to="/member" replace />} />
            </Routes>
        </PreviewProvider>
    );
}
