interface CourseBannerProps {
    coverDesktop: string | null;
    coverMobile: string | null;
    courseName: string;
}

export function CourseBanner({ coverDesktop, coverMobile, courseName }: CourseBannerProps) {
    const hasDesktop = coverDesktop && coverDesktop.trim() !== "";
    const hasMobile = coverMobile && coverMobile.trim() !== "";

    if (!hasDesktop && !hasMobile) return null;

    return (
        <div className="member-banner">
            {/* Desktop Banner */}
            {hasDesktop && (
                <img
                    src={`/static/uploads/${coverDesktop}`}
                    alt={`Banner de ${courseName}`}
                    className="member-banner-desktop"
                />
            )}
            {/* Mobile Banner */}
            {hasMobile && (
                <img
                    src={`/static/uploads/${coverMobile}`}
                    alt={`Banner de ${courseName}`}
                    className="member-banner-mobile"
                />
            )}
            {/* Gradient overlay */}
            <div className="member-banner-overlay" />
        </div>
    );
}
