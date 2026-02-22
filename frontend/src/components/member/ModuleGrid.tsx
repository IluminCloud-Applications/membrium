import { useRef, useState, useCallback, useEffect } from "react";
import type { MemberModule } from "@/types/member";
import { ModuleCard } from "./ModuleCard";

interface ModuleCarouselProps {
    modules: MemberModule[];
    onModuleClick: (moduleId: number) => void;
    externalTrackRef?: React.RefObject<HTMLDivElement | null>;
    onScrollStateChange?: (canLeft: boolean, canRight: boolean) => void;
}

const DRAG_THRESHOLD = 10; // px — minimum movement to consider it a drag

export function ModuleGrid({ modules, onModuleClick, externalTrackRef, onScrollStateChange }: ModuleCarouselProps) {
    const internalRef = useRef<HTMLDivElement>(null);
    const trackRef = externalTrackRef || internalRef;
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef({ startX: 0, scrollLeft: 0, hasDragged: false, isMouseDown: false });

    // Check scroll boundaries
    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const left = el.scrollLeft > 4;
        const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
        setCanScrollLeft(left);
        setCanScrollRight(right);
        onScrollStateChange?.(left, right);
    }, [onScrollStateChange]);

    useEffect(() => {
        updateScrollState();
        const el = trackRef.current;
        if (!el) return;

        el.addEventListener("scroll", updateScrollState, { passive: true });
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);

        return () => {
            el.removeEventListener("scroll", updateScrollState);
            ro.disconnect();
        };
    }, [updateScrollState, modules]);

    // Arrow click scroll
    function scrollBy(direction: "left" | "right") {
        const el = trackRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }

    // --- Desktop drag-to-scroll (mouse events only) ---
    function handleMouseDown(e: React.MouseEvent) {
        // Only handle left mouse button
        if (e.button !== 0) return;
        const el = trackRef.current;
        if (!el) return;

        dragState.current = {
            startX: e.clientX,
            scrollLeft: el.scrollLeft,
            hasDragged: false,
            isMouseDown: true,
        };
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!dragState.current.isMouseDown) return;
        const el = trackRef.current;
        if (!el) return;

        const dx = e.clientX - dragState.current.startX;

        // Only start dragging after passing threshold
        if (!dragState.current.hasDragged && Math.abs(dx) < DRAG_THRESHOLD) {
            return; // Not a drag yet, allow normal click behavior
        }

        // Now it's a drag — prevent text selection and start scrolling
        e.preventDefault();
        dragState.current.hasDragged = true;
        setIsDragging(true);
        el.scrollLeft = dragState.current.scrollLeft - dx;
    }

    function handleMouseUp() {
        dragState.current.isMouseDown = false;
        // Small delay to ensure click events check hasDragged before we reset
        setTimeout(() => {
            dragState.current.hasDragged = false;
            setIsDragging(false);
        }, 0);
    }

    // Handle click — only navigate if it wasn't a drag
    function handleCardClick(moduleId: number) {
        if (dragState.current.hasDragged) {
            return; // Was a drag, don't navigate
        }
        onModuleClick(moduleId);
    }

    if (!modules.length) {
        return (
            <div className="member-empty-state">
                <i className="ri-folder-open-line" />
                <p>Nenhum módulo disponível ainda.</p>
            </div>
        );
    }

    const sorted = [...modules].sort((a, b) => a.order - b.order);

    return (
        <div className="member-carousel">
            {/* Left arrow */}
            {canScrollLeft && (
                <button
                    className="member-carousel-arrow member-carousel-arrow-left"
                    onClick={() => scrollBy("left")}
                    aria-label="Anterior"
                >
                    <i className="ri-arrow-left-s-line" />
                </button>
            )}

            {/* Track — drag only via mouse (desktop), touch scroll is native */}
            <div
                ref={trackRef}
                className={`member-carousel-track ${isDragging ? "is-dragging" : ""}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {sorted.map((mod, index) => (
                    <ModuleCard
                        key={mod.id}
                        module={mod}
                        index={index}
                        onClick={() => handleCardClick(mod.id)}
                    />
                ))}
            </div>

            {/* Right arrow */}
            {canScrollRight && (
                <button
                    className="member-carousel-arrow member-carousel-arrow-right"
                    onClick={() => scrollBy("right")}
                    aria-label="Próximo"
                >
                    <i className="ri-arrow-right-s-line" />
                </button>
            )}
        </div>
    );
}
