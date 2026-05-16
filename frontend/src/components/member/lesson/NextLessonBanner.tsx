import { useEffect, useRef, useState } from "react";
import { useMediaState } from "@vidstack/react";

const THRESHOLD = 20;
const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface NextLessonBannerProps {
    hasNextLesson: boolean;
    onNextLesson: () => void;
}

export function NextLessonBanner({ hasNextLesson, onNextLesson }: NextLessonBannerProps) {
    const currentTime = useMediaState("currentTime");
    const duration = useMediaState("duration");
    const ended = useMediaState("ended");

    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [remaining, setRemaining] = useState(THRESHOLD);

    const jumpedRef = useRef(false);

    // Auto-jump when video ends (100%)
    useEffect(() => {
        if (!hasNextLesson || !ended || jumpedRef.current || dismissed) return;
        jumpedRef.current = true;
        onNextLesson();
    }, [ended, hasNextLesson, dismissed, onNextLesson]);

    // Show banner and track countdown
    useEffect(() => {
        if (!hasNextLesson || !duration || duration <= 0 || dismissed) return;
        const rem = duration - currentTime;
        const shouldShow = rem <= THRESHOLD && rem > 0;
        setVisible(shouldShow);
        if (shouldShow) {
            const ceiled = Math.ceil(rem);
            setRemaining(ceiled);

            // Auto-jump when countdown hits 0
            if (ceiled <= 0 && !jumpedRef.current) {
                jumpedRef.current = true;
                onNextLesson();
            }
        }
    }, [currentTime, duration, hasNextLesson, dismissed, onNextLesson]);

    if (!visible) return null;

    const progress = Math.max(0, Math.min(1, remaining / THRESHOLD));
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    return (
        <div className="next-lesson-banner" onClick={onNextLesson}>
            <div className="next-lesson-banner-inner">
                <i className="ri-skip-forward-fill next-lesson-banner-icon" />
                <span className="next-lesson-banner-text">Próxima Aula</span>
            </div>

            {/* Circular countdown — click dismisses */}
            <button
                className="next-lesson-banner-dismiss"
                onClick={(e) => {
                    e.stopPropagation();
                    setDismissed(true);
                    setVisible(false);
                }}
                title="Fechar"
            >
                <svg
                    className="next-lesson-countdown-svg"
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                >
                    {/* Track */}
                    <circle
                        className="next-lesson-countdown-track"
                        cx="18" cy="18" r={RADIUS}
                        fill="none"
                        strokeWidth="2.5"
                    />
                    {/* Progress arc */}
                    <circle
                        className="next-lesson-countdown-fill"
                        cx="18" cy="18" r={RADIUS}
                        fill="none"
                        strokeWidth="2.5"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                    />
                    {/* Number */}
                    <text
                        x="18" y="18"
                        className="next-lesson-countdown-label"
                        dominantBaseline="central"
                        textAnchor="middle"
                    >
                        {remaining}
                    </text>
                </svg>
            </button>
        </div>
    );
}
