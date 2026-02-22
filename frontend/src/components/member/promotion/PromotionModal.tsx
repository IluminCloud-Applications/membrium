import { useState, useEffect, useCallback } from "react";
import type { MemberActivePromotion } from "@/types/member";
import { memberService } from "@/services/member";
import { LazyImage } from "@/components/ui/LazyImage";
import { PromotionVideoPlayer } from "./PromotionVideoPlayer";
import { PromotionCTA } from "./PromotionCTA";

const COOLDOWN_KEY = "membrium_promo_dismissed";
const COOLDOWN_HOURS = 6;

interface PromotionModalProps {
    promotion: MemberActivePromotion;
}

export function PromotionModal({ promotion }: PromotionModalProps) {
    const [visible, setVisible] = useState(false);
    const [showCta, setShowCta] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (shouldShowPromotion()) {
            setVisible(true);
            memberService.trackPromotionView(promotion.id).catch(() => { });

            // For images or no delay, show CTA immediately
            if (promotion.mediaType === "image" || promotion.ctaDelay === 0) {
                setShowCta(true);
            }
        }
    }, [promotion.id]);

    function shouldShowPromotion(): boolean {
        try {
            const raw = localStorage.getItem(COOLDOWN_KEY);
            if (!raw) return true;
            const data = JSON.parse(raw);
            const dismissedAt = data.timestamp;
            const promoId = data.promoId;

            // Different promotion? Show it
            if (promoId !== promotion.id) return true;

            // Same promotion — check cooldown
            const elapsed = Date.now() - dismissedAt;
            const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
            return elapsed >= cooldownMs;
        } catch {
            return true;
        }
    }

    function handleClose() {
        setClosing(true);
        // Save dismissal timestamp + promo id
        localStorage.setItem(
            COOLDOWN_KEY,
            JSON.stringify({ promoId: promotion.id, timestamp: Date.now() })
        );
        setTimeout(() => setVisible(false), 300);
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

    if (!visible) return null;

    return (
        <div className={`promo-modal-overlay ${closing ? "promo-modal-closing" : ""}`}>
            <div className={`promo-modal ${closing ? "promo-modal-exit" : ""}`}>
                {/* Close button */}
                <button className="promo-modal-close" onClick={handleClose} aria-label="Fechar">
                    <i className="ri-close-line" />
                </button>

                {/* Media content */}
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
                            onClick={promotion.hasCta && promotion.ctaUrl ? handleCtaClick : undefined}
                            role={promotion.hasCta ? "link" : undefined}
                        >
                            <LazyImage
                                className="promo-modal-image"
                                src={promotion.mediaUrl}
                                alt={promotion.description}
                                rootMargin="0px"
                                fallbackIcon="ri-image-line"
                            />
                        </div>
                    )}
                </div>

                {/* Description + CTA */}
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
