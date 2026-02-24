import type { ReactNode } from "react";

interface AuthLayoutModernProps {
    children: ReactNode;
    backgroundImage?: string | null;
    backgroundColor?: string | null;
    overlayOpacity?: number;
    logoUrl?: string | null;
    platformName: string;
    customCss?: string | null;
}

export function AuthLayoutModern({
    children,
    backgroundImage,
    backgroundColor,
    overlayOpacity = 50,
    logoUrl,
    platformName,
    customCss,
}: AuthLayoutModernProps) {
    const bgImageUrl = backgroundImage
        ? `/static/uploads/${backgroundImage}`
        : null;

    const logoSrc = logoUrl
        ? `/static/uploads/${logoUrl}`
        : null;

    return (
        <>
            {customCss && <style>{customCss}</style>}

            <div className="grid min-h-svh lg:grid-cols-2">
                {/* Left side — form panel (bg color controls this) */}
                <div
                    className="auth-modern-form relative flex flex-col gap-4 p-6 md:p-10"
                    style={{ backgroundColor: backgroundColor || undefined }}
                >
                    {/* Mobile background image (visible only on mobile) */}
                    {bgImageUrl && (
                        <div className="absolute inset-0 lg:hidden">
                            <img
                                src={bgImageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
                                }}
                            />
                        </div>
                    )}

                    {/* Brand top-left */}
                    <div className="relative z-10 flex justify-center gap-2 md:justify-start">
                        <a href="#" className="flex items-center gap-2 font-medium">
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt={platformName}
                                    className="h-8 object-contain"
                                />
                            ) : (
                                <>
                                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <i className="ri-graduation-cap-line text-sm" />
                                    </div>
                                    <span className="text-sm font-semibold">{platformName}</span>
                                </>
                            )}
                        </a>
                    </div>

                    {/* Centered content */}
                    <div className="relative z-10 flex flex-1 items-center justify-center">
                        <div className="w-full max-w-sm animate-scale-in">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Right side — image (desktop only) */}
                <div className="bg-muted relative hidden lg:block">
                    {bgImageUrl ? (
                        <>
                            <img
                                src={bgImageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
                                }}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-3 text-muted-foreground">
                                <i className="ri-image-line text-6xl opacity-30" />
                                <p className="text-sm opacity-50">
                                    Adicione uma imagem nas configurações
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
