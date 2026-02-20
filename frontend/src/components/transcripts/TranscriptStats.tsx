interface TranscriptStatsProps {
    totalTranscripts: number;
    coursesWithTranscripts: number;
    totalKeywords: number;
}

export function TranscriptStats({
    totalTranscripts,
    coursesWithTranscripts,
    totalKeywords,
}: TranscriptStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-file-text-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Total de Transcrições
                    </p>
                    <p className="text-xl font-bold">{totalTranscripts}</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <i className="ri-book-open-line text-emerald-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Cursos com Transcrições
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        {coursesWithTranscripts}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-hashtag text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Palavras-chave Indexadas
                    </p>
                    <p className="text-xl font-bold text-primary">
                        {totalKeywords}
                    </p>
                </div>
            </div>
        </div>
    );
}
