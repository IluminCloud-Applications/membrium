interface AuthHeaderProps {
    title: string;
    subtitle?: string;
    showLogo?: boolean;
}

export function AuthHeader({ title, subtitle, showLogo = true }: AuthHeaderProps) {
    return (
        <div className="auth-header">
            {showLogo && (
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo.webp"
                        alt="Membrium"
                        className="h-10 w-auto"
                    />
                </div>
            )}
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
    );
}
