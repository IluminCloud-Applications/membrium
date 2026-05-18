import { useEffect, useRef, useState } from "react";
import { useMediaState } from "@vidstack/react";

const THRESHOLD = 15;

interface NextLessonInfo {
    title: string;
    thumbnailUrl: string | null;
}

interface NextLessonBannerProps {
    hasNextLesson: boolean;
    onNextLesson: () => void;
    nextLesson?: NextLessonInfo;
}

export function NextLessonBanner({ hasNextLesson, onNextLesson, nextLesson }: NextLessonBannerProps) {
    const currentTime = useMediaState("currentTime");
    const duration = useMediaState("duration");
    const ended = useMediaState("ended");

    const [visible, setVisible] = useState(false);
    const [remaining, setRemaining] = useState(THRESHOLD);

    const jumpedRef = useRef(false);

    // Auto-jump when video ends (100%)
    useEffect(() => {
        if (!hasNextLesson || !ended || jumpedRef.current) return;
        jumpedRef.current = true;
        onNextLesson();
    }, [ended, hasNextLesson, onNextLesson]);

    // Show banner and track countdown
    useEffect(() => {
        if (!hasNextLesson || !duration || duration <= 0) return;
        const rem = duration - currentTime;
        const shouldShow = rem <= THRESHOLD && rem > 0;
        setVisible(shouldShow);
        if (shouldShow) {
            const ceiled = Math.ceil(rem);
            setRemaining(ceiled);

            if (ceiled <= 0 && !jumpedRef.current) {
                jumpedRef.current = true;
                onNextLesson();
            }
        }
    }, [currentTime, duration, hasNextLesson, onNextLesson]);

    if (!visible) return null;

    return (
        <div className="next-lesson-banner" onClick={onNextLesson}>
            {/* Thumbnail (optional) */}
            {nextLesson?.thumbnailUrl && (
                <div className="next-lesson-banner-thumb">
                    <img
                        src={nextLesson.thumbnailUrl}
                        alt={nextLesson.title}
                        className="next-lesson-banner-thumb-img"
                    />
                    <div className="next-lesson-banner-thumb-overlay">
                        <i className="ri-play-fill" />
                    </div>
                </div>
            )}

            {/* Info: label + title */}
            <div className="next-lesson-banner-info">
                <span className="next-lesson-banner-label">
                    <i className="ri-skip-forward-fill" />
                    Próxima aula em {remaining}s
                </span>
                {nextLesson?.title && (
                    <span className="next-lesson-banner-title">{nextLesson.title}</span>
                )}
            </div>
        </div>
    );
}
