import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="auth-layout">
            <div className="auth-card animate-scale-in">
                {children}
            </div>
        </div>
    );
}
