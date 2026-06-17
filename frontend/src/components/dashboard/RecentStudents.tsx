import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RecentStudent } from "@/services/dashboard";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatRelativeDate(dateString?: string | null) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";

        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        } else {
            return `no dia ${format(date, "dd/MM/yyyy")}`;
        }
    } catch {
        return "";
    }
}


interface RecentStudentsProps {
    students: RecentStudent[];
}

export function RecentStudents({ students }: RecentStudentsProps) {
    if (students.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <i className="ri-user-add-line text-primary text-lg" />
                        <h3 className="font-semibold text-sm">Novos Alunos</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <i className="ri-user-smile-line text-3xl mb-2" />
                        <p className="text-sm">Nenhum aluno cadastrado</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="ri-user-add-line text-primary text-lg" />
                        <h3 className="font-semibold text-sm">Novos Alunos</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {students.length} recente{students.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {students.map((student) => {
                    const initials = student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                    return (
                        <div
                            key={student.id}
                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                        >
                            <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{student.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {student.course_name || student.email}
                                </p>
                            </div>
                            {student.created_at && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 self-start mt-1">
                                    {formatRelativeDate(student.created_at)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
