/* ============================================
   SIDEBAR DATA — Menu items configuration
   Icons: Remix Icon classes
   ============================================ */

export interface NavItem {
    title: string;
    url: string;
    icon: string; // Remix Icon class
    isActive?: boolean;
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
            },
            {
                title: "Alunos",
                url: "/admin/alunos",
                icon: "ri-group-line",
            },
        ],
    },
    {
        label: "Conteúdo",
        items: [
            {
                title: "Vitrine",
                url: "/admin/vitrine",
                icon: "ri-store-2-line",
            },
            {
                title: "Promoções",
                url: "/admin/promocoes",
                icon: "ri-megaphone-line",
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
                icon: "ri-file-text-line",
            },
            {
                title: "Arquivos",
                url: "/admin/arquivos",
                icon: "ri-folder-3-line",
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
            },
            {
                title: "Integrações",
                url: "/admin/configuracoes/integracoes",
                icon: "ri-puzzle-line",
            },
            {
                title: "Int. Artificial",
                url: "/admin/configuracoes/ia",
                icon: "ri-robot-2-line",
            },
        ],
    },
];
