import { useRef, useState, useCallback, useEffect } from "react";
import type { MemberModule } from "@/types/member";
import { ModuleCard } from "./ModuleCard";

interface ModuleCarouselProps {
    modules: MemberModule[];
    onModuleClick: (moduleId: number) => void;
}

export function ModuleGrid({ modules, onModuleClick }: ModuleCarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });

    // Check scroll boundaries
    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

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

    // Drag handlers
    function handlePointerDown(e: React.PointerEvent) {
        const el = trackRef.current;
        if (!el) return;
        setIsDragging(true);
        dragState.current = { startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
        el.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (!isDragging) return;
        const el = trackRef.current;
        if (!el) return;
        const dx = e.clientX - dragState.current.startX;
        if (Math.abs(dx) > 3) dragState.current.moved = true;
        el.scrollLeft = dragState.current.scrollLeft - dx;
    }

    function handlePointerUp(e: React.PointerEvent) {
        setIsDragging(false);
        trackRef.current?.releasePointerCapture(e.pointerId);
    }

    // Prevent click after drag
    function handleCardClick(moduleId: number) {
        if (dragState.current.moved) {
            dragState.current.moved = false;
            return;
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

            {/* Track */}
            <div
                ref={trackRef}
                className={`member-carousel-track ${isDragging ? "is-dragging" : ""}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
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
