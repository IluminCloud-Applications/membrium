const MAX_THUMBNAIL_WIDTH = 640;
const SEEK_TARGET_SECONDS = 5;
const EXTRACTION_TIMEOUT_MS = 8000;

/**
 * Extracts a single frame from a local video File in the browser using <video> + <canvas>.
 * Returns a compressed WebP (or JPEG fallback) File, or null if the browser cannot decode it.
 */
export function extractVideoThumbnail(file: File): Promise<File | null> {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        let settled = false;
        const finish = (result: File | null) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            video.removeAttribute("src");
            video.load();
            URL.revokeObjectURL(objectUrl);
            resolve(result);
        };

        const timer = window.setTimeout(() => finish(null), EXTRACTION_TIMEOUT_MS);

        video.onerror = () => finish(null);

        video.onloadedmetadata = () => {
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            const targetTime =
                duration > SEEK_TARGET_SECONDS
                    ? SEEK_TARGET_SECONDS
                    : duration > 0
                      ? duration * 0.25
                      : 0;
            try {
                video.currentTime = targetTime;
            } catch {
                finish(null);
            }
        };

        video.onseeked = () => {
            try {
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                if (!vw || !vh) {
                    finish(null);
                    return;
                }

                const scale = vw > MAX_THUMBNAIL_WIDTH ? MAX_THUMBNAIL_WIDTH / vw : 1;
                const width = Math.round(vw * scale);
                const height = Math.round(vh * scale);

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    finish(null);
                    return;
                }

                ctx.drawImage(video, 0, 0, width, height);

                canvas.toBlob(
                    (webpBlob) => {
                        if (webpBlob) {
                            finish(new File([webpBlob], "thumbnail.webp", { type: "image/webp" }));
                            return;
                        }
                        // Fallback to JPEG if WebP encoding is not supported by the browser
                        canvas.toBlob(
                            (jpegBlob) => {
                                if (jpegBlob) {
                                    finish(new File([jpegBlob], "thumbnail.jpg", { type: "image/jpeg" }));
                                } else {
                                    finish(null);
                                }
                            },
                            "image/jpeg",
                            0.8,
                        );
                    },
                    "image/webp",
                    0.75,
                );
            } catch {
                finish(null);
            }
        };

        video.src = objectUrl;
    });
}
