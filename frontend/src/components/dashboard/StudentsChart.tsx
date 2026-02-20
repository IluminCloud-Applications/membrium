import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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

/** Mock courses list */
const mockCourses = [
    { id: "all", name: "Todos os Cursos" },
    { id: "marketing", name: "Marketing Digital" },
    { id: "copywriting", name: "Copywriting Avançado" },
    { id: "trafego", name: "Tráfego Pago" },
];

/** Generate mock daily data per course */
function generateMockData() {
    const data: { date: string; curso: string; novos: number; ativos: number }[] = [];
    const now = new Date();
    const courseIds = mockCourses.filter((c) => c.id !== "all").map((c) => c.id);

    for (let i = 90; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        for (const curso of courseIds) {
            data.push({
                date: dateStr,
                curso,
                novos: Math.floor(Math.random() * 5) + 1,
                ativos: Math.floor(Math.random() * 10) + 2,
            });
        }
    }

    return data;
}

const rawChartData = generateMockData();

/** Aggregate data per date (sum all courses or filter by one) */
function aggregateByDate(
    data: typeof rawChartData,
    courseId: string
) {
    const filtered = courseId === "all" ? data : data.filter((d) => d.curso === courseId);

    const map = new Map<string, { novos: number; ativos: number }>();
    for (const item of filtered) {
        const existing = map.get(item.date) || { novos: 0, ativos: 0 };
        existing.novos += item.novos;
        existing.ativos += item.ativos;
        map.set(item.date, existing);
    }

    return Array.from(map.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

const chartConfig = {
    alunos: { label: "Alunos" },
    novos: {
        label: "Novos Alunos",
        color: "var(--primary)",
    },
    ativos: {
        label: "Alunos Ativos",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

export function StudentsChart() {
    const [timeRange, setTimeRange] = useState("30d");
    const [selectedCourse, setSelectedCourse] = useState("all");

    const aggregatedData = aggregateByDate(rawChartData, selectedCourse);

    const filteredData = aggregatedData.filter((item) => {
        const date = new Date(item.date);
        const now = new Date();
        let daysToSubtract = 30;

        if (timeRange === "90d") daysToSubtract = 90;
        else if (timeRange === "7d") daysToSubtract = 7;

        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
    });

    return (
        <Card className="border-0 shadow-sm pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <i className="ri-bar-chart-grouped-line text-primary text-lg" />
                        Novos Alunos
                    </CardTitle>
                    <CardDescription>
                        Acompanhe o crescimento da sua plataforma
                    </CardDescription>
                </div>
                <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger
                            className="w-[180px] rounded-lg"
                            aria-label="Selecionar curso"
                        >
                            <SelectValue placeholder="Todos os Cursos" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {mockCourses.map((course) => (
                                <SelectItem
                                    key={course.id}
                                    value={course.id}
                                    className="rounded-lg"
                                >
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="w-[160px] rounded-lg"
                            aria-label="Selecionar período"
                        >
                            <SelectValue placeholder="Últimos 30 dias" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                Últimos 3 meses
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Últimos 30 dias
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                Últimos 7 dias
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="fillNovos" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-novos)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-novos)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillAtivos" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-ativos)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-ativos)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("pt-BR", {
                                    month: "short",
                                    day: "numeric",
                                });
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) =>
                                        new Date(value).toLocaleDateString("pt-BR", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="ativos"
                            type="natural"
                            fill="url(#fillAtivos)"
                            stroke="var(--color-ativos)"
                            stackId="a"
                        />
                        <Area
                            dataKey="novos"
                            type="natural"
                            fill="url(#fillNovos)"
                            stroke="var(--color-novos)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
