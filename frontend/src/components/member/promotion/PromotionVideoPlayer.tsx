import { useRef, useEffect, useState } from "react";
import {
    MediaPlayer,
    MediaProvider,
    Controls,
    PlayButton,
    MuteButton,
    FullscreenButton,
    Spinner,
    Poster,
    useMediaState,
    useMediaPlayer,
    type MediaPlayerInstance,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import { VTurbPlayer } from "../lesson/VTurbPlayer";
import { integrationsService } from "@/services/integrations";

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

    if (videoSource === "vturb") {
        return <VTurbPromoLoader videoId={src} />;
    }

    const videoSrc = getVideoSource(src, videoSource);

    return (
        <div className="promo-video-container">
            <MediaPlayer
                ref={playerRef}
                title="Promoção"
                src={videoSrc}
                playsinline
                className="promo-media-player"
            >
                <MediaProvider className="promo-media-provider" />
                <Poster className="vds-poster absolute inset-0 w-full h-full object-cover bg-black/50 transition-opacity duration-300 opacity-0 data-[visible]:opacity-100" />
                <PromoLoadingIndicator />
                <ClickToPlay />
                <PromoControls />
            </MediaPlayer>
        </div>
    );
}

/** Loading spinner — same pattern as VideoPlayer */
function PromoLoadingIndicator() {
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

/** Controls sem barra de progresso — usuário não pode pular o vídeo */
function PromoControls() {
    const paused = useMediaState("paused");

    return (
        <>
            {/* Big center play button — only visible when paused */}
            {paused && (
                <div className="promo-play-overlay">
                    <PlayButton 
                        className="promo-big-play-btn" 
                        style={{ animation: "promoPulseScale 2s infinite" }}
                    >
                        <i className="ri-play-fill" />
                    </PlayButton>
                    <style>{`
                        @keyframes promoPulseScale {
                            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                            70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
                            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                        }
                    `}</style>
                </div>
            )}

            {/* Bottom controls — sem TimeSlider para não permitir pular */}
            <Controls.Root className="promo-controls" hideDelay={2500} hideOnMouseLeave>
                <Controls.Group className="promo-controls-bar">
                    <div className="promo-controls-left">
                        <PlayButton className="promo-ctrl-btn">
                            <i className={paused ? "ri-play-fill" : "ri-pause-fill"} />
                        </PlayButton>

                        <MuteButton className="promo-ctrl-btn">
                            <PromoMuteIcon />
                        </MuteButton>
                    </div>

                    <div className="promo-controls-right">
                        <FullscreenButton className="promo-ctrl-btn">
                            <PromoFullscreenIcon />
                        </FullscreenButton>
                    </div>
                </Controls.Group>
            </Controls.Root>
        </>
    );
}

function PromoMuteIcon() {
    const muted = useMediaState("muted");
    const volume = useMediaState("volume");
    if (muted || volume === 0) return <i className="ri-volume-mute-fill" />;
    if (volume < 0.5) return <i className="ri-volume-down-fill" />;
    return <i className="ri-volume-up-fill" />;
}

function PromoFullscreenIcon() {
    const fullscreen = useMediaState("fullscreen");
    return fullscreen
        ? <i className="ri-fullscreen-exit-fill" />
        : <i className="ri-fullscreen-fill" />;
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

/* ---- VTurb embed loader ---- */

function VTurbPromoLoader({ videoId }: { videoId: string }) {
    const [orgId, setOrgId] = useState("");

    useEffect(() => {
        integrationsService.getAll()
            .then((data) => setOrgId(data.vturb?.org_id || ""))
            .catch(() => { /* ignore */ });
    }, []);

    return <VTurbPlayer videoId={videoId} orgId={orgId} />;
}
