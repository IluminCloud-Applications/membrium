interface PromotionCTAProps {
    visible: boolean;
    text: string;
    onClick: () => void;
}

export function PromotionCTA({ visible, text, onClick }: PromotionCTAProps) {
    if (!visible) return null;

    return (
        <div className="promo-cta-wrap animate-scale-in">
            <button className="promo-cta-button" onClick={onClick}>
                <span className="promo-cta-shimmer" />
                <span>{text}</span>
                <i className="ri-arrow-right-s-line" />
            </button>
        </div>
    );
}
