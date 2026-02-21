/**
 * Loading skeleton for the file grid.
 * Shows placeholder cards while files are being fetched.
 */
export function FileLoadingSkeleton() {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border bg-card overflow-hidden shadow-sm animate-pulse"
                >
                    <div className="aspect-video bg-muted" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="flex justify-between">
                            <div className="h-3 w-16 bg-muted rounded" />
                            <div className="h-3 w-20 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
