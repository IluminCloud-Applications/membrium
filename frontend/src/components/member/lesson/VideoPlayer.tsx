import { useRef, useEffect, useState } from "react";
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
    Spinner,
    useMediaState,
    useMediaPlayer,
    type MediaPlayerInstance,
} from "@vidstack/react";
import { useCallback } from "react";

import "@vidstack/react/player/styles/base.css";
import { VTurbPlayer } from "./VTurbPlayer";
import { NextLessonBanner } from "./NextLessonBanner";

interface VideoPlayerProps {
    title: string;
    src: string;
    videoType: string;
    lessonId?: number;
    hasNextLesson?: boolean;
    nextLesson?: { title: string; thumbnailUrl: string | null };
    initialTime?: number;
    onNextLesson?: () => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({
    title,
    src,
    videoType,
    lessonId,
    hasNextLesson,
    nextLesson,
    initialTime,
    onNextLesson,
    onTimeUpdate,
}: VideoPlayerProps) {
    if (videoType === "vturb") {
        return <VTurbEmbedLoader videoId={src} />;
    }

    const playerKey = `${videoType}-${src}-${lessonId ?? 0}`;

    return (
        <VidstackPlayer
            key={playerKey}
            title={title}
            src={src}
            videoType={videoType}
            hasNextLesson={hasNextLesson}
            nextLesson={nextLesson}
            initialTime={initialTime}
            onNextLesson={onNextLesson}
            onTimeUpdate={onTimeUpdate}
        />
    );
}

/* ---- Inner vidstack player (keyed mount) ---- */

interface VidstackPlayerProps {
    title: string;
    src: string;
    videoType: string;
    hasNextLesson?: boolean;
    nextLesson?: { title: string; thumbnailUrl: string | null };
    initialTime?: number;
    onNextLesson?: () => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
}

function VidstackPlayer({
    title,
    src,
    videoType,
    hasNextLesson,
    nextLesson,
    initialTime,
    onNextLesson,
    onTimeUpdate,
}: VidstackPlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);
    const seekedRef = useRef(false);

    const videoSrc = buildVideoSource(src, videoType);

    useEffect(() => {
        if (!playerRef.current || !onTimeUpdate) return;
        return playerRef.current.subscribe(({ currentTime, duration }) => {
            onTimeUpdate(currentTime, duration);

            // Seek to initialTime once the player has duration
            if (!seekedRef.current && initialTime && initialTime > 0 && duration > 0) {
                seekedRef.current = true;
                playerRef.current!.currentTime = initialTime;
            }
        });
    }, [onTimeUpdate, initialTime]);

    return (
        <div className="lesson-video-container">
            <MediaPlayer
                ref={playerRef}
                title={title}
                src={videoSrc}
                playsInline
                className="lesson-media-player"
            >
                <MediaProvider className="lesson-media-provider" />
                <VideoLoadingIndicator />
                <ClickToPlay />
                <VideoControls
                    hasNextLesson={hasNextLesson}
                    onNextLesson={onNextLesson}
                />
                {hasNextLesson && onNextLesson && (
                    <NextLessonBanner
                        hasNextLesson={hasNextLesson}
                        onNextLesson={onNextLesson}
                        nextLesson={nextLesson}
                    />
                )}
            </MediaPlayer>
        </div>
    );
}

/* ---- Source builder ---- */

function buildVideoSource(src: string, videoType: string): any {
    // YouTube: vidstack expects "youtube/{videoId}" string
    if (videoType === "youtube") {
        const match = src.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
        );
        if (match) return `youtube/${match[1]}`;
        if (src.startsWith("youtube/")) return src;
        return `youtube/${src}`;
    }

    // Direct video URL (R2 Cloudflare, S3, etc): use explicit type object
    // This prevents vidstack from guessing the type and failing with HLS checks
    return { src, type: resolveVideoMime(src) };
}

function resolveVideoMime(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "application/x-mpegurl";
    if (lower.includes(".mpd")) return "application/dash+xml";
    if (lower.includes(".webm")) return "video/webm";
    if (lower.includes(".ogg") || lower.includes(".ogv")) return "video/ogg";
    // Default to mp4 — R2/CDN links usually serve mp4
    return "video/mp4";
}

/* ---- Sub-components ---- */

function VideoLoadingIndicator() {
    const isWaiting = useMediaState("waiting");
    const canPlay = useMediaState("canPlay");

    if (!isWaiting && canPlay) return null;

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/20">
            <Spinner.Root className="w-12 h-12 text-primary opacity-80 animate-spin">
                <Spinner.Track className="opacity-25" />
                <Spinner.TrackFill className="opacity-75" />
                <svg className="w-full h-full text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </Spinner.Root>
        </div>
    );
}

/** Invisible overlay — click anywhere on the video to toggle play/pause */
function ClickToPlay() {
    const player = useMediaPlayer();
    const canPlay = useMediaState("canPlay");

    function handleClick() {
        if (!player || !canPlay) return;

        if (player.paused) {
            player.play().catch(() => {});
        } else {
            player.pause().catch(() => {});
        }
    }

    return (
        <div className="lesson-click-to-play" onClick={handleClick} />
    );
}

const SPEED_OPTIONS = [
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: "Normal", value: 1 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "2x", value: 2 },
];

function SpeedSelector() {
    const player = useMediaPlayer();
    const [open, setOpen] = useState(false);
    const [rate, setRate] = useState(1);
    const ref = useRef<HTMLDivElement>(null);

    const select = useCallback((value: number) => {
        if (player) player.playbackRate = value;
        setRate(value);
        setOpen(false);
    }, [player]);

    useEffect(() => {
        function onOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [open]);

    const label = SPEED_OPTIONS.find(o => o.value === rate)?.label ?? `${rate}x`;

    return (
        <div className="lesson-speed-selector" ref={ref}>
            <button className="lesson-ctrl-btn lesson-speed-btn" onClick={() => setOpen(v => !v)}>
                <i className="ri-speed-up-fill" />
                <span className="lesson-speed-label">{label}</span>
            </button>
            {open && (
                <div className="lesson-speed-dropdown">
                    {SPEED_OPTIONS.map(o => (
                        <button
                            key={o.value}
                            className={`lesson-speed-option${rate === o.value ? " active" : ""}`}
                            onClick={() => select(o.value)}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function VideoControls(_: { hasNextLesson?: boolean; onNextLesson?: () => void }) {
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
            <Controls.Root className="lesson-controls" hideDelay={2500} hideOnMouseLeave>
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
                        <SpeedSelector />

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

/* ---- VTurb embed loader ---- */

function VTurbEmbedLoader({ videoId }: { videoId: string }) {
    const [orgId, setOrgId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/vturb-config")
            .then((r) => r.json())
            .then((data) => setOrgId(data.org_id || ""))
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="lesson-video-container lesson-video-custom flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin text-2xl text-muted-foreground" />
            </div>
        );
    }

    return <VTurbPlayer videoId={videoId} orgId={orgId} />;
}
