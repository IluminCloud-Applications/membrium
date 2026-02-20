import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Activity {
    id: number;
    type: "student_join" | "course_create" | "lesson_add" | "student_complete";
    description: string;
    time: string;
}

interface ActivityFeedProps {
    activities: Activity[];
}

const activityIcons: Record<Activity["type"], { icon: string; color: string }> = {
    student_join: { icon: "ri-user-add-line", color: "text-blue-500" },
    course_create: { icon: "ri-book-open-line", color: "text-primary" },
    lesson_add: { icon: "ri-play-circle-line", color: "text-emerald-500" },
    student_complete: { icon: "ri-checkbox-circle-line", color: "text-amber-500" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <i className="ri-time-line text-primary text-lg" />
                        <h3 className="font-semibold text-sm">Atividade Recente</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <i className="ri-history-line text-3xl mb-2" />
                        <p className="text-sm">Nenhuma atividade recente</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <i className="ri-time-line text-primary text-lg" />
                    <h3 className="font-semibold text-sm">Atividade Recente</h3>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.map((activity) => {
                        const config = activityIcons[activity.type];
                        return (
                            <div key={activity.id} className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    <i className={`${config.icon} ${config.color} text-base`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
