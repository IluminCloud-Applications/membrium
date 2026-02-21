import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CourseStudentData } from "@/services/dashboard";

interface StudentsChartProps {
    courses: CourseStudentData[];
}

const chartConfig = {
    student_count: {
        label: "Alunos",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

export function StudentsChart({ courses }: StudentsChartProps) {
    const [selectedCourse, setSelectedCourse] = useState("all");

    const filteredData = useMemo(() => {
        if (selectedCourse === "all") return courses;
        return courses.filter((c) => String(c.id) === selectedCourse);
    }, [courses, selectedCourse]);

    const isEmpty = courses.length === 0;

    return (
        <Card className="border-0 shadow-sm pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <i className="ri-bar-chart-grouped-line text-primary text-lg" />
                        Alunos por Curso
                    </CardTitle>
                    <CardDescription>
                        Distribuição de alunos entre seus cursos
                    </CardDescription>
                </div>
                {!isEmpty && (
                    <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger
                                className="w-[200px] rounded-lg"
                                aria-label="Selecionar curso"
                            >
                                <SelectValue placeholder="Todos os Cursos" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="rounded-lg">
                                    Todos os Cursos
                                </SelectItem>
                                {courses.map((course) => (
                                    <SelectItem
                                        key={course.id}
                                        value={String(course.id)}
                                        className="rounded-lg"
                                    >
                                        {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {isEmpty ? (
                    <EmptyChartState />
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[250px] w-full"
                    >
                        <BarChart data={filteredData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) =>
                                    value.length > 18
                                        ? value.substring(0, 18) + "..."
                                        : value
                                }
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                allowDecimals={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => value}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Bar
                                dataKey="student_count"
                                fill="var(--primary)"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={48}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

function EmptyChartState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <i className="ri-bar-chart-line text-3xl mb-2" />
            <p className="text-sm">Nenhum curso cadastrado ainda</p>
            <p className="text-xs mt-1">
                Crie seu primeiro curso para ver as estatísticas
            </p>
        </div>
    );
}
