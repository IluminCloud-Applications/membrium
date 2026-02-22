import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Handles the root "/" redirect logic.
 * - If authenticated as admin → /admin
 * - If authenticated as student → /member
 * - If not authenticated → /login
 */
export function AuthRedirect() {
    const { authState, userType } = useAuth();

    if (authState === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    if (authState === "authenticated") {
        if (userType === "admin") {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/member" replace />;
    }

    return <Navigate to="/login" replace />;
}
