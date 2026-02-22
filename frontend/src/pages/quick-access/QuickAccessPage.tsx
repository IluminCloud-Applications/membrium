import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { authService } from "@/services/authService";

type QuickAccessState = "loading" | "success" | "error";

/**
 * Quick-access page: /quick-access/:uuid
 * Authenticates the student using their UUID token,
 * then redirects to /member.
 */
export function QuickAccessPage() {
    const { uuid } = useParams<{ uuid: string }>();
    const [state, setState] = useState<QuickAccessState>("loading");

    useEffect(() => {
        if (!uuid) {
            setState("error");
            return;
        }

        authService
            .quickAccess(uuid)
            .then((res) => {
                if (res.success) {
                    setState("success");
                } else {
                    setState("error");
                }
            })
            .catch(() => {
                setState("error");
            });
    }, [uuid]);

    if (state === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
                    <p className="text-sm text-muted-foreground">Autenticando...</p>
                </div>
            </div>
        );
    }

    if (state === "success") {
        return <Navigate to="/member" replace />;
    }

    // Error state — redirect to login
    return <Navigate to="/login" replace />;
}
