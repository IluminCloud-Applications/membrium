import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth, type UserType } from "@/hooks/useAuth";

interface ProtectedRouteProps {
    /** Which user type is allowed. If not specified, any authenticated user is allowed. */
    allowedType?: UserType;
    children: React.ReactNode;
}

/**
 * Wrapper component that protects routes.
 * Redirects to /login if not authenticated.
 * Optionally enforces a specific user type (admin or student).
 *
 * Special case: admins can access student routes with ?preview=true
 */
export function ProtectedRoute({ allowedType, children }: ProtectedRouteProps) {
    const { authState, userType } = useAuth();
    const [searchParams] = useSearchParams();
    const isPreview = searchParams.get("preview") === "true";

    if (authState === "loading") {
        return <LoadingSpinner />;
    }

    if (authState === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    // Allow admin preview of student area
    if (allowedType === "student" && userType === "admin" && isPreview) {
        return <>{children}</>;
    }

    // If a specific type is required and user doesn't match, redirect appropriately
    if (allowedType && userType !== allowedType) {
        if (userType === "admin") {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/member" replace />;
    }

    return <>{children}</>;
}

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
                <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
            </div>
        </div>
    );
}
