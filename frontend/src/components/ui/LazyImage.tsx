import { useState, useRef, useEffect, useCallback } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    draggable?: boolean;
    /** Distance in pixels before the viewport to start loading (default: 200px) */
    rootMargin?: string;
    /** Fallback icon class (remix icon) for when there's no image */
    fallbackIcon?: string;
    /** Optional click handler */
    onClick?: () => void;
}

/**
 * Smart lazy-loading image component.
 * - Uses IntersectionObserver to detect visibility
 * - Shows a skeleton shimmer while not in viewport
 * - Fades in smoothly when the image is loaded
 * - Configurable rootMargin for pre-loading before entering viewport
 */
export function LazyImage({
    src,
    alt,
    className = "",
    draggable = true,
    rootMargin = "200px",
    fallbackIcon,
    onClick,
}: LazyImageProps) {
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold: 0 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin]);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoaded(true);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`lazy-image-container ${className}`}
            onClick={onClick}
        >
            {/* Skeleton shimmer — visible until image loads */}
            {!isLoaded && (
                <div className="lazy-image-skeleton" />
            )}

            {/* Only render <img> when element is in viewport */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    className={`lazy-image ${isLoaded ? "lazy-image-loaded" : ""}`}
                    draggable={draggable}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}

            {/* Error fallback */}
            {hasError && fallbackIcon && (
                <div className="lazy-image-fallback">
                    <i className={fallbackIcon} />
                </div>
            )}
        </div>
    );
}
