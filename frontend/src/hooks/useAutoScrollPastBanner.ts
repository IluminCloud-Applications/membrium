import { useEffect, useRef } from "react";

/**
 * Automatically performs a gentle smooth scroll on mobile devices
 * when a tall banner (e.g. 9:16 cover_mobile) would fill the entire viewport.
 *
 * Conditions to scroll:
 * 1. User is on mobile (viewport ≤ 640px)
 * 2. The course has a mobile cover banner
 * 3. The user is at the top of the page (scrollY ≈ 0)
 *
 * The scroll target is passed as a ref — typically the course header below the banner.
 */

interface UseAutoScrollOptions {
    /** Whether the course has a mobile cover set */
    hasMobileCover: boolean;
    /** Delay in ms before the scroll happens (default: 1200) */
    delay?: number;
}

export function useAutoScrollPastBanner(
    targetRef: React.RefObject<HTMLElement | null>,
    { hasMobileCover, delay = 1200 }: UseAutoScrollOptions
) {
    const hasScrolled = useRef(false);

    useEffect(() => {
        if (hasScrolled.current) return;
        if (!hasMobileCover) return;

        const isMobile = window.innerWidth <= 640;
        if (!isMobile) return;

        const timer = setTimeout(() => {
            if (window.scrollY > 50) return;

            const target = targetRef.current;
            if (!target) return;

            const targetRect = target.getBoundingClientRect();
            const headerHeight = 64;
            const peekOffset = 80;
            const scrollTo = window.scrollY + targetRect.top - headerHeight - peekOffset;

            if (scrollTo > 100) {
                window.scrollTo({ top: scrollTo, behavior: "smooth" });
                hasScrolled.current = true;
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [hasMobileCover, delay, targetRef]);
}
