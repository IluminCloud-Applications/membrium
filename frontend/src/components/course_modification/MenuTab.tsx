import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CourseMenuItem } from "@/types/course-modification";

interface MenuTabProps {
    menuItems: CourseMenuItem[];
    onAddItem: () => void;
    onEditItem: (item: CourseMenuItem) => void;
    onDeleteItem: (item: CourseMenuItem) => void;
}

export function MenuTab({ menuItems, onAddItem, onEditItem, onDeleteItem }: MenuTabProps) {
    if (menuItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                    <i className="ri-menu-add-line text-primary text-3xl" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Nenhum item de menu</h3>
                <p className="text-sm mb-4 text-center max-w-sm">
                    Adicione links úteis como Suporte, WhatsApp, Comunidade e mais
                    para facilitar o acesso dos seus alunos.
                </p>
                <Button onClick={onAddItem} className="btn-brand gap-2 rounded-lg">
                    <i className="ri-add-line" />
                    Adicionar Primeiro Link
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Info */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <i className="ri-links-line text-purple-600 text-lg" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold">Links do Menu</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Esses links ficam visíveis no menu lateral do curso para os alunos.
                            Ideal para suporte, comunidade, WhatsApp e mais.
                        </p>
                    </div>
                    <Button onClick={onAddItem} className="btn-brand gap-2 rounded-lg" size="sm">
                        <i className="ri-add-line" />
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Items list */}
            <div className="space-y-2">
                {menuItems.map((item) => (
                    <MenuItemRow
                        key={item.id}
                        item={item}
                        onEdit={() => onEditItem(item)}
                        onDelete={() => onDeleteItem(item)}
                    />
                ))}
            </div>
        </div>
    );
}

/* ---- Menu item row ---- */

interface MenuItemRowProps {
    item: CourseMenuItem;
    onEdit: () => void;
    onDelete: () => void;
}

function MenuItemRow({ item, onEdit, onDelete }: MenuItemRowProps) {
    return (
        <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all">
            {/* Drag handle */}
            <div className="flex-shrink-0 cursor-move text-muted-foreground hover:text-foreground transition-colors">
                <i className="ri-draggable text-lg" />
            </div>

            {/* Icon */}
            <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-primary text-lg`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            </div>

            {/* Actions */}
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
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={onEdit} className="rounded-lg cursor-pointer">
                        <i className="ri-pencil-line mr-2 text-base" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                    >
                        <i className="ri-delete-bin-line mr-2 text-base" />
                        Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
