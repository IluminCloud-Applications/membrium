import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { MemberHomePage, MemberProfilePage, LessonPlayerPage } from "@/pages/member";
import { PreviewProvider } from "@/contexts/PreviewContext";

/**
 * Student member area routes.
 * Mounted at /member/*
 *
 * Supports ?preview=true for admin preview mode.
 *
 * NOTE: Authentication is handled by ProtectedRoute in App.tsx.
 */
export function MemberRoutes() {
    const [searchParams] = useSearchParams();
    const isPreview = searchParams.get("preview") === "true";

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
