/**
 * Continue Watching — localStorage utilities.
 *
 * Tracks:
 * - Last lesson ID per module (which lesson the student was watching)
 * - Video playback time for each lesson (so the video resumes at that point)
 */

const STORAGE_KEY = "membrium_continue_watching";

export interface ContinueWatchingEntry {
    lessonId: number;
    videoTime: number;
    updatedAt: number; // timestamp
}

/** Map keyed by "courseId:moduleId" */
type StorageData = Record<string, ContinueWatchingEntry>;

function getAll(): StorageData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAll(data: StorageData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function buildKey(courseId: number, moduleId: number) {
    return `${courseId}:${moduleId}`;
}

/** Get the saved position for a specific module. */
export function getContinueWatching(
    courseId: number,
    moduleId: number
): ContinueWatchingEntry | null {
    const key = buildKey(courseId, moduleId);
    return getAll()[key] ?? null;
}

/** Save continue-watching data for a module. */
export function saveContinueWatching(
    courseId: number,
    moduleId: number,
    lessonId: number,
    videoTime: number
) {
    const data = getAll();
    const key = buildKey(courseId, moduleId);
    data[key] = { lessonId, videoTime, updatedAt: Date.now() };
    saveAll(data);
}

/** Get all entries (used to show "continue watching" on homepage). */
export function getAllContinueWatching(): Array<{
    courseId: number;
    moduleId: number;
    entry: ContinueWatchingEntry;
}> {
    const data = getAll();
    return Object.entries(data).map(([key, entry]) => {
        const [courseId, moduleId] = key.split(":").map(Number);
        return { courseId, moduleId, entry };
    });
}

/** Remove entry for a module (e.g. when 100% completed). */
export function removeContinueWatching(courseId: number, moduleId: number) {
    const data = getAll();
    delete data[buildKey(courseId, moduleId)];
    saveAll(data);
}
