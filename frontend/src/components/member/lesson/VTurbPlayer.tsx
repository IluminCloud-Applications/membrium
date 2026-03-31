import { useEffect, useRef } from "react";

interface VTurbPlayerProps {
    videoId: string;
    orgId: string;
}

/**
 * Renders a VTurb smart player by creating the custom element and injecting
 * the player script. Cleaned up on unmount to avoid duplicate scripts when
 * navigating between lessons.
 */
export function VTurbPlayer({ videoId, orgId }: VTurbPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const playerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!videoId || !orgId || !containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = "";
        if (scriptRef.current) {
            scriptRef.current.remove();
            scriptRef.current = null;
        }

        // Create the <vturb-smartplayer> custom element
        const player = document.createElement("vturb-smartplayer");
        player.id = `vid-${videoId}`;
        player.style.cssText = "display: block; margin: 0 auto; width: 100%; max-width: 100%;";
        containerRef.current.appendChild(player);
        playerRef.current = player;

        // Inject the player script
        const script = document.createElement("script");
        script.src = `https://scripts.converteai.net/${orgId}/players/${videoId}/v4/player.js`;
        script.async = true;
        document.head.appendChild(script);
        scriptRef.current = script;

        return () => {
            if (scriptRef.current) {
                scriptRef.current.remove();
                scriptRef.current = null;
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [videoId, orgId]);

    if (!videoId || !orgId) {
        return (
            <div className="lesson-video-container lesson-video-custom flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                    VTurb: ID do vídeo ou Org ID não configurados.
                </p>
            </div>
        );
    }

    return (
        <div className="lesson-video-container lesson-video-custom">
            <div ref={containerRef} />
        </div>
    );
}
