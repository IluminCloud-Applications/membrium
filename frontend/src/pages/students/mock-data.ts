import type { Student } from "@/types/student";
import type { Course } from "@/types/course";

/**
 * Mock courses available for assignment.
 * In production, this would come from the API.
 */
export const mockAvailableCourses: Pick<Course, "id" | "name">[] = [
    { id: 1, name: "Marketing Digital Avançado" },
    { id: 2, name: "Copywriting Persuasivo" },
    { id: 3, name: "Tráfego Pago Masterclass" },
    { id: 4, name: "Instagram para Negócios" },
    { id: 5, name: "Funis de Vendas" },
];

/**
 * Mock students for development.
 */
export const mockStudents: Student[] = [
    {
        id: 1,
        name: "João Silva",
        email: "joao@email.com",
        status: "active",
        courses: [
            { id: 1, name: "Marketing Digital Avançado" },
            { id: 2, name: "Copywriting Persuasivo" },
        ],
        createdAt: "2026-02-15T10:00:00Z",
        quickAccessToken: "abc123-token",
    },
    {
        id: 2,
        name: "Maria Santos",
        email: "maria@email.com",
        status: "active",
        courses: [
            { id: 1, name: "Marketing Digital Avançado" },
        ],
        createdAt: "2026-02-14T08:30:00Z",
        quickAccessToken: "def456-token",
    },
    {
        id: 3,
        name: "Carlos Oliveira",
        email: "carlos@email.com",
        status: "inactive",
        courses: [
            { id: 3, name: "Tráfego Pago Masterclass" },
            { id: 4, name: "Instagram para Negócios" },
        ],
        createdAt: "2026-02-10T14:20:00Z",
        quickAccessToken: "ghi789-token",
    },
    {
        id: 4,
        name: "Ana Beatriz Costa",
        email: "ana.costa@email.com",
        status: "active",
        courses: [
            { id: 2, name: "Copywriting Persuasivo" },
            { id: 5, name: "Funis de Vendas" },
            { id: 1, name: "Marketing Digital Avançado" },
        ],
        createdAt: "2026-02-08T16:45:00Z",
        quickAccessToken: "jkl012-token",
    },
    {
        id: 5,
        name: "Pedro Henrique Lima",
        email: "pedro.lima@email.com",
        status: "active",
        courses: [
            { id: 4, name: "Instagram para Negócios" },
        ],
        createdAt: "2026-02-05T09:15:00Z",
        quickAccessToken: "mno345-token",
    },
    {
        id: 6,
        name: "Fernanda Rocha",
        email: "fernanda@email.com",
        status: "inactive",
        courses: [],
        createdAt: "2026-01-28T11:00:00Z",
        quickAccessToken: "pqr678-token",
    },
    {
        id: 7,
        name: "Lucas Mendes",
        email: "lucas.mendes@email.com",
        status: "active",
        courses: [
            { id: 1, name: "Marketing Digital Avançado" },
            { id: 3, name: "Tráfego Pago Masterclass" },
            { id: 5, name: "Funis de Vendas" },
        ],
        createdAt: "2026-01-20T13:30:00Z",
        quickAccessToken: "stu901-token",
    },
    {
        id: 8,
        name: "Camila Alves",
        email: "camila.alves@email.com",
        status: "active",
        courses: [
            { id: 2, name: "Copywriting Persuasivo" },
        ],
        createdAt: "2026-01-15T10:00:00Z",
        quickAccessToken: "vwx234-token",
    },
];
