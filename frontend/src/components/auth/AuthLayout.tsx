import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
    backgroundImage?: string | null;
    backgroundColor?: string | null;
    overlayOpacity?: number;
    customCss?: string | null;
}

export function AuthLayout({
    children,
    backgroundImage,
    backgroundColor,
    overlayOpacity = 50,
    customCss,
}: AuthLayoutProps) {
    const bgImageUrl = backgroundImage
        ? `/static/uploads/${backgroundImage}`
        : null;

    return (
        <>
            {customCss && <style>{customCss}</style>}

            <div
                className="auth-layout"
                style={{
                    backgroundColor: backgroundColor || undefined,
                    position: "relative",
                }}
            >
                {/* Background image + overlay */}
                {bgImageUrl && (
                    <>
                        <img
                            src={bgImageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ zIndex: 0 }}
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
                                zIndex: 1,
                            }}
                        />
                    </>
                )}

                <div className="auth-card animate-scale-in" style={{ zIndex: 2, position: "relative" }}>
                    {children}
                </div>
            </div>
        </>
    );
}
