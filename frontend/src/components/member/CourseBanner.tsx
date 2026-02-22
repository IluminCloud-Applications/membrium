import { LazyImage } from "@/components/ui/LazyImage";

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
                <LazyImage
                    src={`/static/uploads/${coverDesktop}`}
                    alt={`Banner de ${courseName}`}
                    className="member-banner-desktop"
                    rootMargin="100px"
                    fallbackIcon="ri-image-line"
                />
            )}
            {/* Mobile Banner */}
            {hasMobile && (
                <LazyImage
                    src={`/static/uploads/${coverMobile}`}
                    alt={`Banner de ${courseName}`}
                    className="member-banner-mobile"
                    rootMargin="100px"
                    fallbackIcon="ri-image-line"
                />
            )}
            {/* Gradient overlay */}
            <div className="member-banner-overlay" />
        </div>
    );
}
