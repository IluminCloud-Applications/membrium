import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/student";
import { statusLabels, statusColors } from "@/types/student";

interface StudentTableProps {
    students: Student[];
    onEdit: (student: Student) => void;
    onManageCourses: (student: Student) => void;
    onResendAccess: (student: Student) => void;
    onQuickAccess: (student: Student) => void;
    onDelete: (student: Student) => void;
}

export function StudentTable({
    students,
    onEdit,
    onManageCourses,
    onResendAccess,
    onQuickAccess,
    onDelete,
}: StudentTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">Nome</TableHead>
                        <TableHead className="font-semibold px-4">Email</TableHead>
                        <TableHead className="font-semibold px-4">Cursos</TableHead>
                        <TableHead className="font-semibold px-4">Status</TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {students.map((student) => (
                        <StudentRow
                            key={student.id}
                            student={student}
                            onEdit={onEdit}
                            onManageCourses={onManageCourses}
                            onResendAccess={onResendAccess}
                            onQuickAccess={onQuickAccess}
                            onDelete={onDelete}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---- Individual row ---- */

interface StudentRowProps {
    student: Student;
    onEdit: (student: Student) => void;
    onManageCourses: (student: Student) => void;
    onResendAccess: (student: Student) => void;
    onQuickAccess: (student: Student) => void;
    onDelete: (student: Student) => void;
}

function StudentRow({
    student,
    onEdit,
    onManageCourses,
    onResendAccess,
    onQuickAccess,
    onDelete,
}: StudentRowProps) {
    const maxVisibleCourses = 2;
    const visibleCourses = student.courses.slice(0, maxVisibleCourses);
    const extraCount = student.courses.length - maxVisibleCourses;

    return (
        <TableRow className="group">
            {/* Name */}
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[180px]">{student.name}</span>
                </div>
            </TableCell>

            {/* Email */}
            <TableCell className="text-muted-foreground text-sm px-4">
                {student.email}
            </TableCell>

            {/* Courses */}
            <TableCell className="px-4">
                <div className="flex flex-wrap gap-1">
                    {visibleCourses.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                            Nenhum curso
                        </span>
                    ) : (
                        <>
                            {visibleCourses.map((course) => (
                                <Badge
                                    key={course.id}
                                    variant="secondary"
                                    className="text-[10px] bg-primary/8 text-primary/80"
                                >
                                    {course.name}
                                </Badge>
                            ))}
                            {extraCount > 0 && (
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] bg-muted text-muted-foreground cursor-default"
                                            >
                                                +{extraCount}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="bottom"
                                            className="max-w-[220px] p-2"
                                        >
                                            <p className="text-xs font-medium mb-1">Todos os cursos:</p>
                                            <ul className="space-y-0.5">
                                                {student.courses.map((c) => (
                                                    <li key={c.id} className="text-xs flex items-center gap-1">
                                                        <i className="ri-book-open-line text-[10px] text-primary" />
                                                        {c.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </>
                    )}
                </div>
            </TableCell>

            {/* Status */}
            <TableCell className="px-4">
                <Badge
                    variant="secondary"
                    className={`text-[11px] font-medium ${statusColors[student.status]}`}
                >
                    <i
                        className={`ri-circle-fill text-[6px] mr-1 ${student.status === "active"
                            ? "text-emerald-500"
                            : "text-red-400"
                            }`}
                    />
                    {statusLabels[student.status]}
                </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right pr-6 px-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <i className="ri-more-2-fill text-lg" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => onEdit(student)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-pencil-line mr-2 text-base" />
                            Editar Aluno
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onManageCourses(student)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-book-open-line mr-2 text-base" />
                            Gerenciar Cursos
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onResendAccess(student)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-mail-send-line mr-2 text-base" />
                            Reenviar Acesso
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onQuickAccess(student)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-link mr-2 text-base" />
                            Link de Acesso Rápido
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => onDelete(student)}
                            className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                        >
                            <i className="ri-delete-bin-line mr-2 text-base" />
                            Excluir Aluno
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
