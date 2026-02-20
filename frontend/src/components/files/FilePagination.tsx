import { Button } from "@/components/ui/button";

interface FilePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function FilePagination({
    currentPage,
    totalPages,
    onPageChange,
}: FilePaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getVisiblePages(currentPage, totalPages);

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 w-8 p-0"
            >
                <i className="ri-arrow-left-s-line" />
            </Button>

            {pages.map((page, idx) =>
                page === "..." ? (
                    <span
                        key={`ellipsis-${idx}`}
                        className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground"
                    >
                        ...
                    </span>
                ) : (
                    <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page as number)}
                        className={`h-8 w-8 p-0 ${page === currentPage ? "btn-brand" : ""
                            }`}
                    >
                        {page}
                    </Button>
                )
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
            >
                <i className="ri-arrow-right-s-line" />
            </Button>
        </div>
    );
}

function getVisiblePages(
    current: number,
    total: number
): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) pages.push("...");

    pages.push(total);

    return pages;
}
