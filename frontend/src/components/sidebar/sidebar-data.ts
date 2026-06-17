/* ============================================
   SIDEBAR DATA — Menu items configuration
   Icons: Remix Icon classes
   ============================================ */

export type AdminRole = 'admin' | 'support';

export interface NavItem {
    title: string;
    url: string;
    icon: string; // Remix Icon class
    isActive?: boolean;
    roles?: AdminRole[]; // if undefined, visible to all admin roles
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const sidebarNavGroups: NavGroup[] = [
    {
        label: "Gerenciamento",
        items: [
            {
                title: "Dashboard",
                url: "/admin",
                icon: "ri-dashboard-3-line",
                isActive: true,
            },
            {
                title: "Cursos",
                url: "/admin/cursos",
                icon: "ri-book-open-line",
                roles: ['admin'],
            },
            {
                title: "Alunos",
                url: "/admin/alunos",
                icon: "ri-group-line",
            },
        ],
    },
    {
        label: "Recursos",
        items: [
            {
                title: "Vitrine",
                url: "/admin/vitrine",
                icon: "ri-store-2-line",
                roles: ['admin'],
            },
            {
                title: "Promoções",
                url: "/admin/promocoes",
                icon: "ri-megaphone-line",
                roles: ['admin'],
            },
            {
                title: "Eventos",
                url: "/admin/eventos",
                icon: "ri-calendar-event-line",
                roles: ['admin'],
            },
            {
                title: "FAQ",
                url: "/admin/faq",
                icon: "ri-question-answer-line",
            },
        ],
    },
    {
        label: "Ferramentas",
        items: [
            {
                title: "Transcrições",
                url: "/admin/transcricoes",
                icon: "ri-mic-2-ai-line",
            },
            {
                title: "Arquivos",
                url: "/admin/arquivos",
                icon: "ri-folder-3-line",
                roles: ['admin'],
            },
        ],
    },
    {
        label: "Configurações",
        items: [
            {
                title: "Gerais",
                url: "/admin/configuracoes",
                icon: "ri-settings-3-line",
                roles: ['admin'],
            },
            {
                title: "Personalização",
                url: "/admin/configuracoes/personalizacao",
                icon: "ri-palette-line",
                roles: ['admin'],
            },
            {
                title: "Integrações",
                url: "/admin/configuracoes/integracoes",
                icon: "ri-puzzle-line",
                roles: ['admin'],
            },
            {
                title: "Int. Artificial",
                url: "/admin/configuracoes/ia",
                icon: "ri-robot-2-line",
                roles: ['admin'],
            },
            {
                title: "Usuários",
                url: "/admin/configuracoes/usuarios",
                icon: "ri-user-settings-line",
                roles: ['admin'],
            },
        ],
    },
];

/** Filter sidebar groups/items based on admin role */
export function filterNavGroupsByRole(groups: NavGroup[], role: string): NavGroup[] {
    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.roles || item.roles.includes(role as AdminRole)
            ),
        }))
        .filter((group) => group.items.length > 0);
}
