interface LessonCTAProps {
    visible: boolean;
    text: string;
    link: string;
}

export function LessonCTA({ visible, text, link }: LessonCTAProps) {
    if (!visible) return null;

    return (
        <div className="lesson-cta-wrap animate-scale-in">
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-cta-button"
            >
                <span className="lesson-cta-shimmer" />
                <i className="ri-external-link-line" />
                <span>{text}</span>
                <i className="ri-arrow-right-s-line" />
            </a>
            <p className="lesson-cta-hint">Clique para acessar conteúdo exclusivo</p>
        </div>
    );
}
