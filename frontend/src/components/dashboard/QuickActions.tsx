import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickAction {
    label: string;
    icon: string;
    href: string;
    variant: "default" | "outline" | "secondary";
}

const quickActions: QuickAction[] = [
    {
        label: "Criar Novo Curso",
        icon: "ri-add-line",
        href: "/admin/cursos",
        variant: "default",
    },
    {
        label: "Gerenciar Alunos",
        icon: "ri-group-line",
        href: "/admin/alunos",
        variant: "outline",
    },
    {
        label: "Importar Alunos",
        icon: "ri-upload-2-line",
        href: "/admin/alunos",
        variant: "outline",
    },
    {
        label: "Configurar Vitrine",
        icon: "ri-store-2-line",
        href: "/admin/vitrine",
        variant: "outline",
    },
];

export function QuickActions() {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center gap-2">
                    <i className="ri-flashlight-line text-primary text-lg" />
                    <h3 className="font-semibold text-sm">Ações Rápidas</h3>
                </div>
            </CardHeader>
            <CardContent className="grid gap-2 pt-0 px-5 pb-5">
                {quickActions.map((action) => (
                    <Button
                        key={action.label}
                        variant={action.variant === "default" ? "default" : "outline"}
                        className={`w-full justify-start h-9 text-sm ${action.variant === "default" ? "btn-brand" : ""
                            }`}
                        asChild
                    >
                        <Link to={action.href}>
                            <i className={`${action.icon} mr-2`} />
                            {action.label}
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
