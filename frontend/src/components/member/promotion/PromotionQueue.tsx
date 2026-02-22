import { useState, useEffect, useCallback } from "react";
import type { MemberActivePromotion } from "@/types/member";
import { memberService } from "@/services/member";
import { PromotionVideoPlayer } from "./PromotionVideoPlayer";
import { PromotionCTA } from "./PromotionCTA";

const DISMISSED_KEY = "membrium_promo_dismissed";
const COOLDOWN_HOURS = 6;

interface PromotionQueueProps {
    promotions: MemberActivePromotion[];
}

/**
 * Manages a queue of promotions.
 * Filters out recently dismissed promotions and shows them one by one.
 * When the user closes one, the next one in the queue is shown.
 */
export function PromotionQueue({ promotions }: PromotionQueueProps) {
    const [queue, setQueue] = useState<MemberActivePromotion[]>([]);

    useEffect(() => {
        const dismissed = getDismissedMap();
        const now = Date.now();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        const filtered = promotions.filter((promo) => {
            const dismissedAt = dismissed[promo.id];
            if (!dismissedAt) return true;
            return now - dismissedAt >= cooldownMs;
        });

        setQueue(filtered);
    }, [promotions]);

    const handleDismiss = useCallback((promoId: number) => {
        // Save this promo as dismissed
        const dismissed = getDismissedMap();
        dismissed[promoId] = Date.now();
        saveDismissedMap(dismissed);

        // Remove from queue → next promo will appear
        setQueue((prev) => prev.filter((p) => p.id !== promoId));
    }, []);

    if (queue.length === 0) return null;

    // Show only the first promo in the queue
    const current = queue[0];
    return (
        <PromotionModalInner
            key={current.id}
            promotion={current}
            onDismiss={handleDismiss}
        />
    );
}

/* ============================================
   Inner modal — handles a single promotion
   ============================================ */

interface PromotionModalInnerProps {
    promotion: MemberActivePromotion;
    onDismiss: (promoId: number) => void;
}

function PromotionModalInner({ promotion, onDismiss }: PromotionModalInnerProps) {
    const [closing, setClosing] = useState(false);
    const [showCta, setShowCta] = useState(false);

    useEffect(() => {
        memberService.trackPromotionView(promotion.id).catch(() => { });

        if (promotion.mediaType === "image" || promotion.ctaDelay === 0) {
            setShowCta(true);
        }
    }, [promotion.id]);

    function handleClose() {
        setClosing(true);
        setTimeout(() => onDismiss(promotion.id), 300);
    }

    function handleMediaClick() {
        if (promotion.hasCta && promotion.ctaUrl) {
            memberService.trackPromotionClick(promotion.id).catch(() => { });
            window.open(promotion.ctaUrl, "_blank", "noopener,noreferrer");
        }
    }

    const handleCtaClick = useCallback(() => {
        memberService.trackPromotionClick(promotion.id).catch(() => { });
        window.open(promotion.ctaUrl, "_blank", "noopener,noreferrer");
    }, [promotion.id, promotion.ctaUrl]);

    const handleVideoTimeUpdate = useCallback(
        (currentTime: number) => {
            if (!showCta && promotion.ctaDelay > 0 && currentTime >= promotion.ctaDelay) {
                setShowCta(true);
            }
        },
        [showCta, promotion.ctaDelay]
    );


    return (
        <div className={`promo-modal-overlay ${closing ? "promo-modal-closing" : ""}`}>
            <div className={`promo-modal ${closing ? "promo-modal-exit" : ""}`}>
                <button className="promo-modal-close" onClick={handleClose} aria-label="Fechar">
                    <i className="ri-close-line" />
                </button>

                <div className="promo-modal-media">
                    {promotion.mediaType === "video" ? (
                        <PromotionVideoPlayer
                            src={promotion.mediaUrl}
                            videoSource={promotion.videoSource}
                            onTimeUpdate={handleVideoTimeUpdate}
                        />
                    ) : (
                        <div
                            className={promotion.hasCta && promotion.ctaUrl ? "promo-modal-media-clickable" : ""}
                            onClick={handleMediaClick}
                            role={promotion.hasCta ? "link" : undefined}
                        >
                            <img
                                className="promo-modal-image"
                                src={promotion.mediaUrl}
                                alt={promotion.description}
                            />
                        </div>
                    )}
                </div>

                <div className="promo-modal-content">
                    {promotion.description && (
                        <p className="promo-modal-description">{promotion.description}</p>
                    )}

                    {promotion.hasCta && (
                        <PromotionCTA
                            visible={showCta}
                            text={promotion.ctaText}
                            onClick={handleCtaClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================
   localStorage helpers — stores { [promoId]: timestamp }
   ============================================ */

function getDismissedMap(): Record<number, number> {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveDismissedMap(map: Record<number, number>) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}
