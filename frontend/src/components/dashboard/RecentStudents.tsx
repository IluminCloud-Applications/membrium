import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Student {
    id: number;
    name: string;
    email: string;
    joinedAt: string; // e.g. "Hoje, 14:32"
    courseName?: string;
}

interface RecentStudentsProps {
    students: Student[];
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
                        <p className="text-sm">Nenhum aluno recente</p>
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
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{student.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {student.courseName || student.email}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {student.joinedAt}
                            </span>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
