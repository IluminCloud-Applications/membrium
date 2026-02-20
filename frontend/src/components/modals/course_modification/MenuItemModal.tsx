import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CourseMenuItem, MenuItemFormData } from "@/types/course-modification";
import { menuIconOptions } from "@/types/course-modification";

interface MenuItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: CourseMenuItem | null;
    onSubmit: (data: MenuItemFormData) => void;
    isLoading?: boolean;
}

const emptyForm: MenuItemFormData = {
    name: "",
    url: "",
    icon: "ri-links-line",
};

export function MenuItemModal({
    open,
    onOpenChange,
    editItem,
    onSubmit,
    isLoading,
}: MenuItemModalProps) {
    const [form, setForm] = useState<MenuItemFormData>(emptyForm);
    const isEditing = !!editItem;

    useEffect(() => {
        if (editItem) {
            setForm({
                name: editItem.name,
                url: editItem.url,
                icon: editItem.icon,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editItem, open]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-menu-add-line"} text-primary`} />
                        {isEditing ? "Editar Link do Menu" : "Novo Link do Menu"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do link."
                            : "Adicione um novo link que ficará visível para seus alunos."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Icon */}
                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <Select
                            value={form.icon}
                            onValueChange={(val) => setForm((prev) => ({ ...prev, icon: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    <span className="flex items-center gap-2">
                                        <i className={form.icon} />
                                        {menuIconOptions.find((o) => o.value === form.icon)?.label ?? "Selecionar"}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {menuIconOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <span className="flex items-center gap-2">
                                            <i className={opt.value} />
                                            {opt.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="menu-item-name">
                            Nome <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="menu-item-name"
                            placeholder="Ex: Suporte, WhatsApp, Comunidade..."
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <Label htmlFor="menu-item-url">
                            Link <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                id="menu-item-url"
                                type="url"
                                placeholder="https://..."
                                value={form.url}
                                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                                className="pl-9"
                                required
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-lg border p-3 bg-muted/30">
                        <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center">
                                <i className={`${form.icon} text-primary`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{form.name || "Nome do link"}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                    {form.url || "https://..."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand"
                            disabled={isLoading || !form.name.trim() || !form.url.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Salvando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className={isEditing ? "ri-save-line" : "ri-add-line"} />
                                    {isEditing ? "Salvar Alterações" : "Adicionar Link"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
