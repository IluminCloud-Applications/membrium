import { useEffect, useRef } from "react";
import type { MemberShowcaseItem } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";

interface ShowcaseSectionProps {
    showcases: MemberShowcaseItem[];
}

export function ShowcaseSection({ showcases }: ShowcaseSectionProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const viewedRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        // Track views for all visible showcases (once)
        showcases.forEach((item) => {
            if (!viewedRef.current.has(item.id)) {
                viewedRef.current.add(item.id);
                memberService.trackShowcaseView(item.id).catch(() => { });
            }
        });
    }, [showcases]);

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
        <section className="member-showcase-section">
            <div className="member-showcase-header">
                <h3 className="member-showcase-title">
                    <i className="ri-store-2-line" />
                    Vitrine
                </h3>
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
            </div>

            <div className="member-showcase-track" ref={trackRef}>
                {showcases.map((item) => (
                    <ShowcaseCard key={item.id} item={item} onClick={handleClick} />
                ))}
            </div>
        </section>
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
