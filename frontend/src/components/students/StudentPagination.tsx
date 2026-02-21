import { Button } from "@/components/ui/button";

interface StudentPaginationProps {
    page: number;
    totalPages: number;
    totalStudents: number;
    onPageChange: (page: number) => void;
}

export function StudentPagination({
    page,
    totalPages,
    totalStudents,
    onPageChange,
}: StudentPaginationProps) {
    if (totalPages <= 1) return null;

    function getVisiblePages(): (number | "...")[] {
        const pages: (number | "...")[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (page > 3) pages.push("...");

        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (page < totalPages - 2) pages.push("...");

        pages.push(totalPages);

        return pages;
    }

    return (
        <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
                {totalStudents} aluno{totalStudents !== 1 ? "s" : ""} no total
            </p>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="h-8 w-8 p-0"
                >
                    <i className="ri-arrow-left-s-line text-lg" />
                </Button>

                {getVisiblePages().map((p, i) =>
                    p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(p)}
                            className={`h-8 w-8 p-0 text-xs ${p === page ? "btn-brand pointer-events-none" : ""
                                }`}
                        >
                            {p}
                        </Button>
                    )
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="h-8 w-8 p-0"
                >
                    <i className="ri-arrow-right-s-line text-lg" />
                </Button>
            </div>
        </div>
    );
}
