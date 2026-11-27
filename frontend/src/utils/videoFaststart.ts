import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const MAX_BROWSER_REMUX_BYTES = 700 * 1024 * 1024; // 700 MB safety cap for 32-bit WASM heap
const HEADER_SCAN_BYTES = 4 * 1024 * 1024; // 4 MB is enough to inspect ftyp + moov
const FFMPEG_CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance && ffmpegInstance.loaded) {
        return ffmpegInstance;
    }
    if (ffmpegLoadPromise) {
        return ffmpegLoadPromise;
    }

    ffmpegLoadPromise = (async () => {
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegInstance = ffmpeg;
        return ffmpeg;
    })();

    try {
        return await ffmpegLoadPromise;
    } catch (err) {
        ffmpegLoadPromise = null;
        throw err;
    }
}

function readAscii(view: DataView, offset: number): string {
    return String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
    );
}

function hasMvexBox(view: DataView, moovStart: number, moovEnd: number): boolean {
    let offset = moovStart + 8;
    while (offset + 8 <= moovEnd) {
        const size = view.getUint32(offset, false);
        const type = readAscii(view, offset + 4);
        if (type === "mvex") return true;
        if (size < 8) break;
        offset += size;
    }
    return false;
}

/**
 * Inspects the first bytes of a local MP4 file in < 5ms.
 * Returns true if the file has `moov` after `mdat` OR is a fragmented MP4 (`mvex`/`moof`),
 * both of which cause browsers to issue dozens/hundreds of 206 range requests on playback.
 */
export async function needsMp4Faststart(file: File): Promise<boolean> {
    const lowerName = file.name.toLowerCase();
    const isMp4Like =
        file.type === "video/mp4" ||
        lowerName.endsWith(".mp4") ||
        lowerName.endsWith(".m4v") ||
        lowerName.endsWith(".mov");

    if (!isMp4Like) return false;

    try {
        const scanLen = Math.min(file.size, HEADER_SCAN_BYTES);
        const buffer = await file.slice(0, scanLen).arrayBuffer();
        const view = new DataView(buffer);

        let offset = 0;
        let seenMoov = false;
        let seenMdat = false;

        while (offset + 8 <= view.byteLength) {
            let size = view.getUint32(offset, false);
            const type = readAscii(view, offset + 4);
            let headerSize = 8;

            if (size === 1) {
                if (offset + 16 > view.byteLength) break;
                const hi = view.getUint32(offset + 8, false);
                const lo = view.getUint32(offset + 12, false);
                size = hi * 2 ** 32 + lo;
                headerSize = 16;
            } else if (size === 0) {
                size = file.size - offset;
            }

            if (size < headerSize) break;

            if (type === "moof") {
                return true;
            }
            if (type === "moov") {
                seenMoov = true;
                if (seenMdat) {
                    return true; // moov appears after mdat (not faststart)
                }
                const moovEnd = Math.min(offset + size, view.byteLength);
                if (hasMvexBox(view, offset, moovEnd)) {
                    return true; // fragmented MP4 (mvex inside moov)
                }
            } else if (type === "mdat") {
                seenMdat = true;
                if (!seenMoov) {
                    return true; // mdat appears before moov (not faststart)
                }
            }

            offset += size;
        }

        // If moov was found before mdat and no mvex/moof was seen, it's already faststart
        return !seenMoov;
    } catch {
        return false;
    }
}

export interface OptimizeMp4Options {
    signal?: AbortSignal;
    onStage?: (stage: "loading" | "remuxing") => void;
}

/**
 * Remuxes an MP4 in the browser using FFmpeg.wasm (`-c copy -movflags +faststart`)
 * with zero re-encoding and zero server CPU. Falls back to the original File on error
 * or when the file exceeds the safe browser WASM memory cap.
 */
export async function optimizeMp4Faststart(
    file: File,
    options: OptimizeMp4Options = {},
): Promise<File> {
    if (options.signal?.aborted) {
        throw new DOMException("Upload cancelado", "AbortError");
    }

    if (file.size > MAX_BROWSER_REMUX_BYTES) {
        return file;
    }

    const needsOptimization = await needsMp4Faststart(file);
    if (!needsOptimization) {
        return file;
    }

    if (options.signal?.aborted) {
        throw new DOMException("Upload cancelado", "AbortError");
    }

    const inputName = `in_${Date.now()}.mp4`;
    const outputName = `out_${Date.now()}.mp4`;
    let ffmpeg: FFmpeg | null = null;

    try {
        options.onStage?.("loading");
        ffmpeg = await getFFmpeg();

        if (options.signal?.aborted) {
            throw new DOMException("Upload cancelado", "AbortError");
        }

        options.onStage?.("remuxing");
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const exitCode = await ffmpeg.exec([
            "-i",
            inputName,
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            outputName,
        ]);

        if (exitCode !== 0) {
            return file;
        }

        const outData = await ffmpeg.readFile(outputName);
        if (!(outData instanceof Uint8Array) || outData.byteLength === 0) {
            return file;
        }

        const outBytes = new Uint8Array(outData.byteLength);
        outBytes.set(outData);
        return new File([outBytes], file.name, {
            type: "video/mp4",
            lastModified: file.lastModified,
        });
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw err;
        }
        console.warn("MP4 faststart optimization failed, falling back to original file:", err);
        return file;
    } finally {
        if (ffmpeg) {
            await ffmpeg.deleteFile(inputName).catch(() => {});
            await ffmpeg.deleteFile(outputName).catch(() => {});
        }
    }
}
