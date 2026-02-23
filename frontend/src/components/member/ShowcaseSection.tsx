import { useEffect, useRef, useState } from "react";
import type { MemberShowcaseItem } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";
import { LazySection } from "@/components/ui/LazySectionContext";

interface ShowcaseSectionProps {
    showcases: MemberShowcaseItem[];
}

export function ShowcaseSection({ showcases }: ShowcaseSectionProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const viewedRef = useRef<Set<number>>(new Set());
    const [canScroll, setCanScroll] = useState(false);

    useEffect(() => {
        showcases.forEach((item) => {
            if (!viewedRef.current.has(item.id)) {
                viewedRef.current.add(item.id);
                memberService.trackShowcaseView(item.id).catch(() => { });
            }
        });
    }, [showcases]);

    useEffect(() => {
        checkCanScroll();
        window.addEventListener("resize", checkCanScroll);
        return () => window.removeEventListener("resize", checkCanScroll);
    }, [showcases]);

    function checkCanScroll() {
        const el = trackRef.current;
        if (!el) return;
        setCanScroll(el.scrollWidth > el.clientWidth);
    }

    function handleClick(item: MemberShowcaseItem) {
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

    return (
        <LazySection as="section" className="member-showcase-section" rootMargin="400px">
            <div className="member-showcase-header">
                <h3 className="member-showcase-title">
                    <i className="ri-gift-2-line" />
                    Desbloqueie ofertas exclusivas
                </h3>
                {canScroll && (
                    <div className="member-showcase-nav">
                        <button
                            className="member-showcase-nav-btn"
                            onClick={() => scrollTrack("left")}
                            aria-label="Anterior"
                        >
                            <i className="ri-arrow-left-s-line" />
                        </button>
                        <button
                            className="member-showcase-nav-btn"
                            onClick={() => scrollTrack("right")}
                            aria-label="Próximo"
                        >
                            <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                )}
            </div>

            <div className="member-showcase-track" ref={trackRef}>
                {showcases.map((item) => (
                    <ShowcaseCard key={item.id} item={item} onClick={handleClick} />
                ))}
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
