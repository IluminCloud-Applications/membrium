import { Routes, Route, Navigate } from "react-router-dom";
import { MemberHomePage, MemberProfilePage } from "@/pages/member";

/**
 * Student member area routes.
 * Mounted at /member/*
 */
export function MemberRoutes() {
    return (
        <Routes>
            <Route index element={<MemberHomePage />} />
            <Route path="perfil" element={<MemberProfilePage />} />
            <Route path="*" element={<Navigate to="/member" replace />} />
        </Routes>
    );
}
