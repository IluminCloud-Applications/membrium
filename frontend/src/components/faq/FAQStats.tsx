interface FAQStatsProps {
    totalFaqs: number;
    lessonsWithFaq: number;
    averageFaqPerLesson: number;
}

export function FAQStats({
    totalFaqs,
    lessonsWithFaq,
    averageFaqPerLesson,
}: FAQStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-question-answer-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Total de FAQs
                    </p>
                    <p className="text-xl font-bold">{totalFaqs}</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <i className="ri-book-open-line text-emerald-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Aulas com FAQ
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        {lessonsWithFaq}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-bar-chart-2-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Média por Aula
                    </p>
                    <p className="text-xl font-bold text-primary">
                        {averageFaqPerLesson}
                    </p>
                </div>
            </div>
        </div>
    );
}
