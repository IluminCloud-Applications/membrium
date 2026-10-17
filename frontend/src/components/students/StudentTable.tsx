import { Badge } from "@/components/ui/badge";
import { formatBrazilianDate } from "@/utils/formatDate";
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
import type { Student, CourseSourceInfo } from "@/types/student";
import { statusLabels, statusColors, PLATFORM_CONFIG, getStudentSources } from "@/types/student";

interface StudentTableProps {
    students: Student[];
    onEdit: (student: Student) => void;
    onManageCourses: (student: Student) => void;
    onResendAccess: (student: Student) => void;
    onQuickAccess: (student: Student) => void;
    onDelete: (student: Student) => void;
    onViewInfo: (student: Student) => void;
}

export function StudentTable({
    students,
    onEdit,
    onManageCourses,
    onResendAccess,
    onQuickAccess,
    onDelete,
    onViewInfo,
}: StudentTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">Nome</TableHead>
                        <TableHead className="font-semibold px-4">Email</TableHead>
                        <TableHead className="font-semibold px-4">Cursos</TableHead>
                        <TableHead className="font-semibold px-4">Cadastro / Acesso</TableHead>
                        <TableHead className="font-semibold px-4">Origem</TableHead>
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
                            onViewInfo={onViewInfo}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function PlatformBadge({ source, compact = false }: { source?: string; compact?: boolean }) {
    if (!source) {
        return (
            <span className="text-xs text-muted-foreground/60 italic pl-2">
                N/A
            </span>
        );
    }

    const clean = source.toLowerCase();
    if (clean === "manual") {
        return (
            <Badge variant="secondary" className={`bg-muted text-muted-foreground font-medium border border-border/50 shadow-sm ${compact ? "text-[10px] px-1.5 py-0" : "text-[11px]"}`}>
                <i className="ri-user-add-line mr-1" /> Manual
            </Badge>
        );
    }

    const config = PLATFORM_CONFIG[clean];

    if (config && config.logo) {
        return (
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 shadow-sm w-fit ${compact ? "px-1.5 py-0.5" : "px-2 py-0.5"}`}>
                <img src={config.logo} alt={config.name} className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} rounded-full object-cover bg-white shrink-0`} />
                <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-medium text-foreground/80`}>{config.name}</span>
            </div>
        );
    }

    return (
        <Badge variant="outline" className={`${compact ? "text-[10px] px-1.5 py-0" : "text-[11px]"} capitalize border-border/50 text-muted-foreground shadow-sm`}>
            {source}
        </Badge>
    );
}

function StudentOriginCell({ student }: { student: Student }) {
    const extra = student.extra_data || {};
    const sources = getStudentSources(extra);

    if (sources.length === 0) {
        return <PlatformBadge source={undefined} />;
    }

    if (sources.length === 1) {
        return <PlatformBadge source={sources[0]} />;
    }

    const courseSourcesMap: Record<string, CourseSourceInfo> =
        extra.course_sources && typeof extra.course_sources === "object" ? extra.course_sources : {};

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1 flex-wrap cursor-default">
                        <PlatformBadge source={sources[0]} />
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-semibold border border-primary/20"
                        >
                            +{sources.length - 1}
                        </Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] p-2.5 space-y-1.5">
                    <p className="text-[11px] font-semibold">Plataformas utilizadas ({sources.length}):</p>
                    <div className="flex flex-wrap gap-1">
                        {sources.map((src) => (
                            <PlatformBadge key={src} source={src} compact />
                        ))}
                    </div>
                    {Object.keys(courseSourcesMap).length > 0 && (
                        <div className="pt-1 border-t border-border/50 space-y-1">
                            {Object.values(courseSourcesMap).map((cs) => (
                                <div key={cs.course_id} className="text-[10px] flex items-center justify-between gap-2">
                                    <span className="truncate font-medium">{cs.course_name}</span>
                                    <span className="capitalize text-primary font-semibold shrink-0">
                                        {PLATFORM_CONFIG[cs.source?.toLowerCase()]?.name || cs.source}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
    onViewInfo: (student: Student) => void;
}

function StudentRow({
    student,
    onEdit,
    onManageCourses,
    onResendAccess,
    onQuickAccess,
    onDelete,
    onViewInfo,
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
                <div>{student.email}</div>
                {student.phone && (
                    <div className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mt-0.5" title="Telefone">
                        <i className="ri-phone-line text-[12px] text-primary/60" />
                        {student.phone}
                    </div>
                )}
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

            {/* Created At & Last Access */}
            <TableCell className="px-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatBrazilianDate(student.createdAt)}
                </span>
                {(student.lastAccessAt || student.extra_data?.last_access_at) ? (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 whitespace-nowrap font-medium" title="Último acesso">
                        <i className="ri-login-circle-line text-[12px]" />
                        {formatBrazilianDate(student.lastAccessAt || student.extra_data?.last_access_at)}
                    </div>
                ) : (
                    <div className="text-[11px] text-muted-foreground/50 italic flex items-center gap-1 mt-0.5 whitespace-nowrap" title="Nunca acessou">
                        <i className="ri-time-line text-[12px]" />
                        Sem acessos
                    </div>
                )}
            </TableCell>

            {/* Origin */}
            <TableCell className="px-4">
                <StudentOriginCell student={student} />
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
                            className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                            <i className="ri-more-2-fill text-lg" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => onViewInfo(student)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-information-line mr-2 text-base" />
                            Informações
                        </DropdownMenuItem>

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

                        <DropdownMenuItem
                            asChild
                            className="rounded-lg cursor-pointer"
                        >
                            <a
                                href={`/member?preview=true&student_uuid=${student.quickAccessToken}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center w-full"
                            >
                                <i className="ri-eye-line mr-2 text-base" />
                                Visualizar como Aluno
                            </a>
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
