import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    description?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                            {trend && (
                                <span
                                    className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"
                                        }`}
                                >
                                    <i
                                        className={`${trend.positive ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
                                            } mr-0.5`}
                                    />
                                    {trend.value}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <i className={`${icon} text-xl text-primary`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
