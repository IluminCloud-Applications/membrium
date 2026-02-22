import { useRef, useState, useCallback, useEffect } from "react";
import type { MemberModule } from "@/types/member";
import { ModuleCard } from "./ModuleCard";

interface ModuleCarouselProps {
    modules: MemberModule[];
    onModuleClick: (moduleId: number) => void;
    externalTrackRef?: React.RefObject<HTMLDivElement | null>;
    onScrollStateChange?: (canLeft: boolean, canRight: boolean) => void;
}

const DRAG_THRESHOLD = 8; // px — minimum movement to consider a drag

export function ModuleGrid({ modules, onModuleClick, externalTrackRef, onScrollStateChange }: ModuleCarouselProps) {
    const internalRef = useRef<HTMLDivElement>(null);
    const trackRef = externalTrackRef || internalRef;
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, scrollLeft: 0, hasDragged: false, active: false });

    // ── Scroll boundaries ──
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

    // ── Arrow click ──
    function scrollBy(direction: "left" | "right") {
        const el = trackRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }

    // ── Document-level listeners for drag end (catches mouseup outside the track) ──
    useEffect(() => {
        function onDocumentMouseMove(e: MouseEvent) {
            if (!dragRef.current.active) return;

            const el = trackRef.current;
            if (!el) return;

            const dx = e.clientX - dragRef.current.startX;

            if (!dragRef.current.hasDragged && Math.abs(dx) < DRAG_THRESHOLD) {
                return; // Not a drag yet
            }

            e.preventDefault();
            dragRef.current.hasDragged = true;
            setIsDragging(true);
            el.scrollLeft = dragRef.current.scrollLeft - dx;
        }

        function onDocumentMouseUp() {
            if (!dragRef.current.active) return;
            dragRef.current.active = false;

            // Delay reset so click handler can check hasDragged
            requestAnimationFrame(() => {
                dragRef.current.hasDragged = false;
                setIsDragging(false);
            });
        }

        document.addEventListener("mousemove", onDocumentMouseMove);
        document.addEventListener("mouseup", onDocumentMouseUp);

        return () => {
            document.removeEventListener("mousemove", onDocumentMouseMove);
            document.removeEventListener("mouseup", onDocumentMouseUp);
        };
    }, []);

    // ── Mouse down on track ──
    function handleMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return; // Only left click
        const el = trackRef.current;
        if (!el) return;

        dragRef.current = {
            startX: e.clientX,
            scrollLeft: el.scrollLeft,
            hasDragged: false,
            active: true,
        };
    }

    // ── Prevent native image/link drag (ghost image fix) ──
    function handleDragStart(e: React.DragEvent) {
        e.preventDefault();
    }

    // ── Card click — only navigate if it wasn't a drag ──
    function handleCardClick(moduleId: number) {
        if (dragRef.current.hasDragged) return;
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
                onMouseDown={handleMouseDown}
                onDragStart={handleDragStart}
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
