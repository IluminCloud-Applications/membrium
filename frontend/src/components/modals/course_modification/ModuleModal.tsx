import { useState, useEffect, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import type { CourseModule, ModuleFormData } from "@/types/course-modification";

interface ModuleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editModule: CourseModule | null;
    onSubmit: (data: ModuleFormData) => void;
    isLoading?: boolean;
}

const emptyForm: ModuleFormData = {
    name: "",
    imageFile: null,
    imagePreview: null,
    hasDelayedUnlock: false,
    unlockAfterDays: 0,
};

export function ModuleModal({
    open,
    onOpenChange,
    editModule,
    onSubmit,
    isLoading,
}: ModuleModalProps) {
    const [form, setForm] = useState<ModuleFormData>(emptyForm);
    const fileRef = useRef<HTMLInputElement>(null);
    const isEditing = !!editModule;

    useEffect(() => {
        if (editModule) {
            setForm({
                name: editModule.name,
                imageFile: null,
                imagePreview: editModule.image,
                hasDelayedUnlock: editModule.hasDelayedUnlock ?? false,
                unlockAfterDays: editModule.unlockAfterDays ?? 0,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editModule, open]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            const preview = URL.createObjectURL(file);
            setForm((prev) => ({ ...prev, imageFile: file, imagePreview: preview }));
        }
    }

    function handleRemoveImage() {
        setForm((prev) => ({ ...prev, imageFile: null, imagePreview: null }));
        if (fileRef.current) fileRef.current.value = "";
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-folder-add-line"} text-primary`} />
                        {isEditing ? "Editar Módulo" : "Novo Módulo"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do módulo."
                            : "Preencha os dados para criar um novo módulo."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="module-name">
                            Nome do Módulo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="module-name"
                            placeholder="Ex: Módulo 1 - Introdução"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Image */}
                    <div className="space-y-2">
                        <Label>Imagem do Módulo</Label>
                        <p className="text-xs text-muted-foreground">
                            Recomendado: proporção 9:16 (720×1280)
                        </p>

                        {form.imagePreview ? (
                            <div className="space-y-3">
                                <div className="rounded-lg overflow-hidden border bg-muted max-w-[200px]">
                                    <img
                                        src={form.imagePreview}
                                        alt="Preview"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileRef.current?.click()}
                                        className="gap-1.5"
                                    >
                                        <i className="ri-image-edit-line" />
                                        Alterar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemoveImage}
                                        className="gap-1.5 text-destructive hover:text-destructive"
                                    >
                                        <i className="ri-delete-bin-line" />
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/2 transition-all cursor-pointer"
                            >
                                <i className="ri-image-add-line text-3xl text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    Clique para enviar uma imagem
                                </p>
                            </button>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Delayed unlock */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <i className="ri-timer-line text-primary" />
                            Desbloqueio Programado
                        </h4>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Desbloquear após X dias</Label>
                                <p className="text-xs text-muted-foreground">
                                    O módulo ficará bloqueado e será liberado automaticamente
                                    após o período definido a partir da compra.
                                </p>
                            </div>
                            <Switch
                                checked={form.hasDelayedUnlock}
                                onCheckedChange={(val) =>
                                    setForm((prev) => ({ ...prev, hasDelayedUnlock: val }))
                                }
                            />
                        </div>

                        {form.hasDelayedUnlock && (
                            <div className="space-y-2 animate-fade-in">
                                <Label htmlFor="module-unlock-days">Dias após a compra</Label>
                                <div className="relative">
                                    <i className="ri-calendar-check-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                                    <Input
                                        id="module-unlock-days"
                                        type="number"
                                        min={1}
                                        placeholder="Ex: 7"
                                        value={form.unlockAfterDays || ""}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                unlockAfterDays: Number(e.target.value),
                                            }))
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    O aluno verá o módulo listado, mas só poderá acessar o conteúdo
                                    após {form.unlockAfterDays || "X"} {form.unlockAfterDays === 1 ? "dia" : "dias"} da compra.
                                </p>
                            </div>
                        )}
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
                            disabled={isLoading || !form.name.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Salvando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className={isEditing ? "ri-save-line" : "ri-add-line"} />
                                    {isEditing ? "Salvar Alterações" : "Criar Módulo"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
