import { useState, useRef, useEffect, useCallback } from "react";
import { useLazySection } from "./LazySectionContext";

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    draggable?: boolean;
    /** Distance in pixels before the viewport to start loading (default: 200px).
     *  Ignored when inside a LazySection — the section controls visibility. */
    rootMargin?: string;
    /** Fallback icon class (remix icon) for when there's no image */
    fallbackIcon?: string;
    /** Optional click handler */
    onClick?: () => void;
}

/**
 * Smart lazy-loading image component.
 * 
 * **Two modes:**
 * 1. **Standalone** — uses its own IntersectionObserver (good for vertical scroll)
 * 2. **Inside a `<LazySection>`** — loads when the section enters the viewport.
 *    This is ideal for carousels where individual observers fail for
 *    off-screen horizontal items.
 * 
 * Features:
 * - Shows a skeleton shimmer while loading
 * - Fades in smoothly when loaded
 * - Error fallback with configurable icon
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
    const sectionVisible = useLazySection();
    const [selfInView, setSelfInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // If inside a LazySection, the section dictates visibility.
    // Otherwise, use self IntersectionObserver.
    const shouldLoad = sectionVisible || selfInView;

    // Self-managed IntersectionObserver (only when NOT inside a LazySection)
    useEffect(() => {
        // If the section already says "visible", skip self observer
        if (sectionVisible) return;

        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSelfInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold: 0 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin, sectionVisible]);

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

            {/* Render <img> when visible (via section or self observer) */}
            {shouldLoad && !hasError && (
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
