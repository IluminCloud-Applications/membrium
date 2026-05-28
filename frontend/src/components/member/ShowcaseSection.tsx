import { useEffect, useRef, useState, useCallback } from "react";
import type { MemberShowcaseItem } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";
import { LazySection } from "@/components/ui/LazySectionContext";

interface ShowcaseSectionProps {
    showcases: MemberShowcaseItem[];
}

const DRAG_THRESHOLD = 8; // px — minimum movement to consider a drag

export function ShowcaseSection({ showcases }: ShowcaseSectionProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const viewedRef = useRef<Set<number>>(new Set());
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, scrollLeft: 0, hasDragged: false, active: false });

    useEffect(() => {
        showcases.forEach((item) => {
            if (!viewedRef.current.has(item.id)) {
                viewedRef.current.add(item.id);
                memberService.trackShowcaseView(item.id).catch(() => { });
            }
        });
    }, [showcases]);

    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const left = el.scrollLeft > 4;
        const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
        setCanScrollLeft(left);
        setCanScrollRight(right);
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
    }, [updateScrollState, showcases]);

    // Drag-to-scroll document listeners
    useEffect(() => {
        function onDocumentMouseMove(e: MouseEvent) {
            if (!dragRef.current.active) return;
            const el = trackRef.current;
            if (!el) return;
            const dx = e.clientX - dragRef.current.startX;
            if (!dragRef.current.hasDragged && Math.abs(dx) < DRAG_THRESHOLD) {
                return;
            }
            e.preventDefault();
            dragRef.current.hasDragged = true;
            setIsDragging(true);
            el.scrollLeft = dragRef.current.scrollLeft - dx;
        }

        function onDocumentMouseUp() {
            if (!dragRef.current.active) return;
            dragRef.current.active = false;
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

    function handleMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return;
        const el = trackRef.current;
        if (!el) return;
        dragRef.current = {
            startX: e.clientX,
            scrollLeft: el.scrollLeft,
            hasDragged: false,
            active: true,
        };
    }

    function handleDragStart(e: React.DragEvent) {
        e.preventDefault();
    }

    function handleClick(item: MemberShowcaseItem) {
        if (dragRef.current.hasDragged) return;
        memberService.trackShowcaseClick(item.id).catch(() => { });
        window.open(item.url, "_blank", "noopener,noreferrer");
    }

    function scrollTrack(direction: "left" | "right") {
        const el = trackRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }

    if (!showcases.length) return null;

    const showArrows = canScrollLeft || canScrollRight;

    return (
        <LazySection as="section" className="member-showcase-section" rootMargin="400px">
            <div className="member-showcase-header">
                <h3 className="member-showcase-title">
                    <i className="ri-gift-2-line" />
                    Desbloqueie ofertas exclusivas
                </h3>
                {showArrows && (
                    <div className="member-showcase-nav-arrows">
                        {canScrollLeft && (
                            <button
                                className="member-showcase-nav-btn"
                                onClick={() => scrollTrack("left")}
                                aria-label="Anterior"
                            >
                                <i className="ri-arrow-left-s-line" />
                            </button>
                        )}
                        {canScrollRight && (
                            <button
                                className="member-showcase-nav-btn"
                                onClick={() => scrollTrack("right")}
                                aria-label="Próximo"
                            >
                                <i className="ri-arrow-right-s-line" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="member-showcase-carousel">
                {/* Left hover arrow */}
                {canScrollLeft && (
                    <button
                        className="member-showcase-carousel-arrow member-showcase-carousel-arrow-left"
                        onClick={() => scrollTrack("left")}
                        aria-label="Anterior"
                      >
                          <i className="ri-arrow-left-s-line" />
                      </button>
                )}

                <div
                    ref={trackRef}
                    className={`member-showcase-track ${isDragging ? "is-dragging" : ""}`}
                    onMouseDown={handleMouseDown}
                    onDragStart={handleDragStart}
                >
                    {showcases.map((item) => (
                        <ShowcaseCard key={item.id} item={item} onClick={handleClick} />
                    ))}
                </div>

                {/* Right hover arrow */}
                {canScrollRight && (
                    <button
                        className="member-showcase-carousel-arrow member-showcase-carousel-arrow-right"
                        onClick={() => scrollTrack("right")}
                        aria-label="Próximo"
                    >
                        <i className="ri-arrow-right-s-line" />
                    </button>
                )}
            </div>
        </LazySection>
    );
}

/* ============================================ */

interface ShowcaseCardProps {
    item: MemberShowcaseItem;
    onClick: (item: MemberShowcaseItem) => void;
}

function ShowcaseCard({ item, onClick }: ShowcaseCardProps) {
    return (
        <button
            className="member-showcase-card"
            onClick={() => onClick(item)}
            title={item.title}
        >
            <div className="member-showcase-card-media">
                {item.imageUrl ? (
                    <LazyImage
                        className="member-showcase-card-img"
                        src={item.imageUrl}
                        alt={item.title}
                        rootMargin="200px"
                        fallbackIcon="ri-image-line"
                    />
                ) : (
                    <div className="member-showcase-card-placeholder">
                        <i className="ri-image-line" />
                    </div>
                )}
                {/* Unlock overlay */}
                <div className="member-showcase-card-unlock">
                    <i className="ri-lock-unlock-line" />
                    <span>Desbloquear</span>
                </div>
            </div>

            <div className="member-showcase-card-body">
                <h4 className="member-showcase-card-title">{item.title}</h4>
                {item.description && (
                    <p className="member-showcase-card-desc">{item.description}</p>
                )}
                <span className="member-showcase-card-link">
                    Acessar <i className="ri-arrow-right-up-line" />
                </span>
            </div>
        </button>
    );
}
