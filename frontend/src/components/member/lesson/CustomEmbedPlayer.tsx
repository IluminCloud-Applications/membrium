import { useEffect, useRef } from "react";

interface CustomEmbedPlayerProps {
    embedCode: string;
    className?: string;
}

/**
 * Checks whether a given string is an HTML embed snippet rather than a plain video URL.
 */
export function isEmbedCode(src: string): boolean {
    if (!src) return false;
    const trimmed = src.trim();
    return (
        trimmed.startsWith("<") ||
        /<(iframe|div|vturb-smartplayer|script|video|embed|object)[\s>]/i.test(trimmed)
    );
}

/**
 * CustomEmbedPlayer renders external embed codes (Playrate, VTurb, PandaVideo, Vimeo, YouTube iframes, etc.)
 * directly into the DOM without Vidstack.
 *
 * Browsers do not execute <script> tags inserted via innerHTML. This component parses the embed code,
 * mounts the HTML elements, and dynamically creates and appends real executable <script> tags in order,
 * ensuring both inline scripts and external player libraries run as expected.
 */
export function CustomEmbedPlayer({ embedCode, className }: CustomEmbedPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !embedCode) return;

        let isCancelled = false;
        container.innerHTML = "";

        const trimmed = embedCode.trim();

        // If it's a plain URL (not HTML tags), render a responsive iframe
        if (!isEmbedCode(trimmed) && /^https?:\/\//i.test(trimmed)) {
            const iframe = document.createElement("iframe");
            iframe.src = trimmed;
            iframe.title = "Video Player";
            iframe.className = "w-full aspect-video border-0 rounded-lg";
            iframe.setAttribute(
                "allow",
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            );
            iframe.setAttribute("allowfullscreen", "true");
            container.appendChild(iframe);
            return () => {
                if (container) container.innerHTML = "";
            };
        }

        // Parse HTML embed code
        const temp = document.createElement("div");
        temp.innerHTML = trimmed;

        // Extract script elements so they can be executed dynamically
        const scripts: HTMLScriptElement[] = [];
        temp.querySelectorAll("script").forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }
            scripts.push(newScript);
            oldScript.remove();
        });

        // Append non-script DOM elements first so scripts can find target elements by ID or class
        while (temp.firstChild) {
            container.appendChild(temp.firstChild);
        }

        // Execute scripts sequentially
        async function runScripts() {
            for (const script of scripts) {
                if (isCancelled || !container) break;

                if (script.src) {
                    await new Promise<void>((resolve) => {
                        const timeout = setTimeout(resolve, 5000);
                        script.onload = () => {
                            clearTimeout(timeout);
                            resolve();
                        };
                        script.onerror = () => {
                            clearTimeout(timeout);
                            resolve();
                        };
                        container.appendChild(script);
                    });
                } else {
                    container.appendChild(script);
                }
            }

            // Dispatch load events for players that listen for page initialization
            if (!isCancelled) {
                window.dispatchEvent(new Event("DOMContentLoaded"));
                window.dispatchEvent(new Event("load"));

                // Playrate player re-init if library was already cached in window
                const w = window as any;
                if (w.PlayratePlayer) {
                    if (typeof w.PlayratePlayer.init === "function") {
                        try { w.PlayratePlayer.init(); } catch { /* ignore */ }
                    } else if (typeof w.PlayratePlayer.scan === "function") {
                        try { w.PlayratePlayer.scan(); } catch { /* ignore */ }
                    }
                }
            }
        }

        runScripts();

        return () => {
            isCancelled = true;
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [embedCode]);

    if (!embedCode || !embedCode.trim()) {
        return (
            <div className="lesson-video-container lesson-video-custom flex items-center justify-center p-8 bg-muted/20 rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Nenhum código de vídeo configurado.</p>
            </div>
        );
    }

    return (
        <div className={`lesson-video-container lesson-video-custom ${className || ""}`}>
            <div ref={containerRef} className="w-full" />
        </div>
    );
}
