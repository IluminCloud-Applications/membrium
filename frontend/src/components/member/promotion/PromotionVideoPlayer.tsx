import { useRef, useEffect } from "react";
import {
    MediaPlayer,
    MediaProvider,
    PlayButton,
    useMediaState,
    useMediaPlayer,
    type MediaPlayerInstance,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";

interface PromotionVideoPlayerProps {
    src: string;
    videoSource: string | null;
    onTimeUpdate: (currentTime: number) => void;
}

export function PromotionVideoPlayer({
    src,
    videoSource,
    onTimeUpdate,
}: PromotionVideoPlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);

    useEffect(() => {
        if (!playerRef.current) return;
        return playerRef.current.subscribe(({ currentTime }) => {
            onTimeUpdate(currentTime);
        });
    }, [onTimeUpdate]);

    // Custom embed (VTurb, Panda, etc.) — render as raw HTML
    if (videoSource === "custom") {
        return (
            <div className="promo-video-container promo-video-custom">
                <div dangerouslySetInnerHTML={{ __html: src }} />
            </div>
        );
    }

    const videoSrc = getVideoSource(src, videoSource);

    return (
        <div className="promo-video-container">
            <MediaPlayer
                ref={playerRef}
                src={videoSrc}
                autoPlay
                className="promo-media-player"
            >
                <MediaProvider className="promo-media-provider" />
                <ClickToPlay />
                <PlayOverlay />
            </MediaPlayer>
        </div>
    );
}

/** Invisible overlay — click anywhere on the video to toggle play/pause */
function ClickToPlay() {
    const player = useMediaPlayer();

    function handleClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (!player) return;
        if (player.paused) {
            player.play();
        } else {
            player.pause();
        }
    }

    return (
        <div className="promo-click-to-play" onClick={handleClick} />
    );
}

/** Big center play button — only visible when paused */
function PlayOverlay() {
    const paused = useMediaState("paused");
    if (!paused) return null;

    return (
        <div className="promo-play-overlay">
            <PlayButton className="promo-big-play-btn">
                <i className="ri-play-fill" />
            </PlayButton>
        </div>
    );
}

function getVideoSource(src: string, videoSource: string | null): string {
    if (videoSource === "youtube") {
        const match = src.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
        );
        if (match) return `youtube/${match[1]}`;
        if (src.startsWith("youtube/")) return src;
        return `youtube/${src}`;
    }
    if (videoSource === "vimeo") {
        const match = src.match(/vimeo\.com\/(\d+)/);
        if (match) return `vimeo/${match[1]}`;
        return src;
    }
    return src;
}
