import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { MemberHomePage, MemberProfilePage, LessonPlayerPage } from "@/pages/member";
import { PreviewProvider } from "@/contexts/PreviewContext";
import { authService } from "@/services/authService";

/**
 * Student member area routes.
 * Mounted at /member/*
 *
 * Supports ?preview=true for admin preview mode.
 * When preview=true, validates the session is admin before allowing access.
 */
export function MemberRoutes() {
    const [searchParams] = useSearchParams();
    const previewParam = searchParams.get("preview") === "true";
    const [previewState, setPreviewState] = useState<"loading" | "allowed" | "denied">(
        previewParam ? "loading" : "allowed"
    );
    const isPreview = previewParam && previewState === "allowed";

    useEffect(() => {
        if (!previewParam) return;

        authService.checkMe().then((res) => {
            if (res.authenticated && res.user?.type === "admin") {
                setPreviewState("allowed");
            } else {
                setPreviewState("denied");
            }
        }).catch(() => {
            setPreviewState("denied");
        });
    }, [previewParam]);

    // Preview mode denied — redirect to login
    if (previewParam && previewState === "denied") {
        return <Navigate to="/login" replace />;
    }

    // Preview mode loading
    if (previewParam && previewState === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
                    <p className="text-sm text-muted-foreground">Verificando permissões...</p>
                </div>
            </div>
        );
    }

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
