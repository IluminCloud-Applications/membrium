import type { ShowcaseItem, ShowcaseCourse } from "@/types/showcase";
import type { CourseGroup } from "@/types/course";

/**
 * Mock courses available for showcase assignment.
 * In production, this would come from the API.
 */
export const mockAvailableCourses: ShowcaseCourse[] = [
    { id: 1, name: "Marketing Digital Avançado" },
    { id: 2, name: "Copywriting Persuasivo" },
    { id: 3, name: "Tráfego Pago Masterclass" },
    { id: 4, name: "Instagram para Negócios" },
    { id: 5, name: "Funis de Vendas" },
];

/**
 * Mock course groups for group-based filtering in the modal.
 * In production, this would come from the API.
 */
export const mockCourseGroups: CourseGroup[] = [
    {
        id: 1,
        name: "Pacote Marketing Digital",
        principalCourseId: 1,
        courseIds: [1, 3, 4, 5],
    },
    {
        id: 2,
        name: "Pacote Copywriting",
        principalCourseId: 2,
        courseIds: [2],
    },
];

/**
 * Mock showcase items for development.
 * In production, this would come from the API.
 */
export const mockShowcaseItems: ShowcaseItem[] = [
    {
        id: 1,
        title: "Marketing Digital Avançado",
        description: "Aprenda as estratégias mais avançadas de marketing digital para escalar seu negócio online.",
        url: "https://exemplo.com/marketing-digital",
        imageUrl: "",
        courses: [
            { id: 1, name: "Marketing Digital Avançado" },
            { id: 2, name: "Copywriting Persuasivo" },
        ],
        priority: 10,
        status: "active",
        views: 1250,
        clicks: 342,
        createdAt: "2026-02-15T10:00:00Z",
    },
    {
        id: 2,
        title: "Copywriting Persuasivo",
        description: "Domine a arte de escrever textos que vendem e converta mais visitantes em clientes.",
        url: "https://exemplo.com/copywriting",
        imageUrl: "",
        courses: [
            { id: 2, name: "Copywriting Persuasivo" },
        ],
        priority: 8,
        status: "active",
        views: 890,
        clicks: 215,
        createdAt: "2026-02-12T14:30:00Z",
    },
    {
        id: 3,
        title: "Tráfego Pago Masterclass",
        description: "Curso completo sobre Facebook Ads, Google Ads e estratégias de escala para seu negócio.",
        url: "https://exemplo.com/trafego-pago",
        imageUrl: "",
        courses: [
            { id: 3, name: "Tráfego Pago Masterclass" },
            { id: 4, name: "Instagram para Negócios" },
        ],
        priority: 7,
        status: "active",
        views: 670,
        clicks: 148,
        createdAt: "2026-02-10T09:15:00Z",
    },
    {
        id: 4,
        title: "Instagram para Negócios",
        description: "Transforme seu perfil do Instagram em uma máquina de vendas com estratégias comprovadas.",
        url: "https://exemplo.com/instagram",
        imageUrl: "",
        courses: [
            { id: 4, name: "Instagram para Negócios" },
        ],
        priority: 5,
        status: "inactive",
        views: 430,
        clicks: 89,
        createdAt: "2026-02-05T16:45:00Z",
    },
    {
        id: 5,
        title: "Funis de Vendas Automatizados",
        description: "Monte funis de vendas que trabalham 24h por dia para você, do zero ao avançado.",
        url: "https://exemplo.com/funis-de-vendas",
        imageUrl: "",
        courses: [
            { id: 5, name: "Funis de Vendas" },
            { id: 1, name: "Marketing Digital Avançado" },
            { id: 3, name: "Tráfego Pago Masterclass" },
        ],
        priority: 6,
        status: "active",
        views: 520,
        clicks: 113,
        createdAt: "2026-01-28T11:00:00Z",
    },
];
