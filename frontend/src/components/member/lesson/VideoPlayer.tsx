import { useRef, useEffect } from "react";
import {
    MediaPlayer,
    MediaProvider,
    Controls,
    PlayButton,
    MuteButton,
    FullscreenButton,
    TimeSlider,
    VolumeSlider,
    Time,
    useMediaState,
    type MediaPlayerInstance,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";

interface VideoPlayerProps {
    title: string;
    src: string;
    videoType: string;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({ title, src, videoType, onTimeUpdate }: VideoPlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);

    // For YouTube, convert to proper src format
    const videoSrc = getVideoSource(src, videoType);

    useEffect(() => {
        if (!playerRef.current || !onTimeUpdate) return;
        return playerRef.current.subscribe(({ currentTime, duration }) => {
            onTimeUpdate(currentTime, duration);
        });
    }, [onTimeUpdate]);

    // If it's vturb/custom, render as raw HTML
    if (videoType === "vturb") {
        return (
            <div className="lesson-video-container lesson-video-custom">
                <div dangerouslySetInnerHTML={{ __html: src }} />
            </div>
        );
    }

    return (
        <div className="lesson-video-container">
            <MediaPlayer
                ref={playerRef}
                title={title}
                src={videoSrc}
                playsinline
                className="lesson-media-player"
            >
                <MediaProvider className="lesson-media-provider" />
                <VideoControls />
            </MediaPlayer>
        </div>
    );
}

function VideoControls() {
    const paused = useMediaState("paused");

    return (
        <>
            {/* Big center play button overlay */}
            {paused && (
                <div className="lesson-play-overlay">
                    <PlayButton className="lesson-big-play-btn">
                        <i className="ri-play-fill" />
                    </PlayButton>
                </div>
            )}

            {/* Bottom controls bar */}
            <Controls.Root className="lesson-controls">
                {/* Progress bar */}
                <Controls.Group className="lesson-controls-progress">
                    <TimeSlider.Root className="lesson-time-slider">
                        <TimeSlider.Track className="lesson-slider-track">
                            <TimeSlider.Progress className="lesson-slider-progress" />
                            <TimeSlider.TrackFill className="lesson-slider-fill" />
                        </TimeSlider.Track>
                    </TimeSlider.Root>
                </Controls.Group>

                {/* Buttons row */}
                <Controls.Group className="lesson-controls-bar">
                    <div className="lesson-controls-left">
                        <PlayButton className="lesson-ctrl-btn">
                            <i className={paused ? "ri-play-fill" : "ri-pause-fill"} />
                        </PlayButton>

                        <MuteButton className="lesson-ctrl-btn lesson-ctrl-mute">
                            <MuteIcon />
                        </MuteButton>

                        <VolumeSlider.Root className="lesson-volume-slider">
                            <VolumeSlider.Track className="lesson-volume-track">
                                <VolumeSlider.TrackFill className="lesson-volume-fill" />
                            </VolumeSlider.Track>
                        </VolumeSlider.Root>

                        <div className="lesson-time-display">
                            <Time type="current" className="lesson-time-text" />
                            <span className="lesson-time-separator">/</span>
                            <Time type="duration" className="lesson-time-text" />
                        </div>
                    </div>

                    <div className="lesson-controls-right">
                        <FullscreenButton className="lesson-ctrl-btn">
                            <FullscreenIcon />
                        </FullscreenButton>
                    </div>
                </Controls.Group>
            </Controls.Root>
        </>
    );
}

function MuteIcon() {
    const muted = useMediaState("muted");
    const volume = useMediaState("volume");
    if (muted || volume === 0) return <i className="ri-volume-mute-fill" />;
    if (volume < 0.5) return <i className="ri-volume-down-fill" />;
    return <i className="ri-volume-up-fill" />;
}

function FullscreenIcon() {
    const fullscreen = useMediaState("fullscreen");
    return fullscreen
        ? <i className="ri-fullscreen-exit-fill" />
        : <i className="ri-fullscreen-fill" />;
}

function getVideoSource(src: string, videoType: string): string {
    if (videoType === "youtube") {
        // Extract YouTube ID from URL or return formatted
        const match = src.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
        );
        if (match) return `youtube/${match[1]}`;
        // If already in vidstack format or just an ID
        if (src.startsWith("youtube/")) return src;
        return `youtube/${src}`;
    }
    return src;
}
