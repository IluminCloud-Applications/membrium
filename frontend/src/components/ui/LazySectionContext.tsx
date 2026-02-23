import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

interface LazySectionContextValue {
    /** Whether this section is "visible" and its children should load */
    isVisible: boolean;
}

const LazySectionContext = createContext<LazySectionContextValue>({ isVisible: false });

/**
 * Hook to check if the parent section is visible.
 * Returns `true` when the section enters the viewport,
 * so all child images can start loading at once.
 */
export function useLazySection(): boolean {
    return useContext(LazySectionContext).isVisible;
}

interface LazySectionProps {
    children: ReactNode;
    /** Distance before entering viewport to trigger loading (default: "300px") */
    rootMargin?: string;
    /** HTML tag for the wrapper (default: "div") */
    as?: keyof HTMLElementTagNameMap;
    className?: string;
}

/**
 * Wraps a section so that when it enters the viewport,
 * ALL child LazyImage components load at once.
 * 
 * This prevents the problem of carousel images not loading
 * because they are outside the horizontal viewport.
 * 
 * Usage:
 * ```tsx
 * <LazySection rootMargin="300px">
 *   <Carousel>
 *     <LazyImage src="..." /> // loads when section is in view
 *     <LazyImage src="..." /> // loads when section is in view
 *   </Carousel>
 * </LazySection>
 * ```
 */
export function LazySection({
    children,
    rootMargin = "300px",
    as: Tag = "div",
    className,
}: LazySectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold: 0 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <LazySectionContext.Provider value={{ isVisible }}>
            {/* @ts-expect-error dynamic tag */}
            <Tag ref={sectionRef} className={className}>
                {children}
            </Tag>
        </LazySectionContext.Provider>
    );
}
