import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromoteFormLeft } from "./PromoteFormLeft";
import { PromoteFormRight } from "./PromoteFormRight";
import type { PromoteItem, PromoteMediaType } from "@/types/promote";

export interface PromoteFormData {
    title: string;
    description: string;
    mediaType: PromoteMediaType;
    mediaUrl: string;
    mediaFile: File | null;
    startDate: string;
    endDate: string;
    hasCta: boolean;
    ctaText: string;
    ctaUrl: string;
    ctaDelay: number;
    isActive: boolean;
}

interface PromoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: PromoteItem | null;
    onSubmit: (data: PromoteFormData) => void;
    isLoading?: boolean;
}

const emptyForm: PromoteFormData = {
    title: "",
    description: "",
    mediaType: "image",
    mediaUrl: "",
    mediaFile: null,
    startDate: "",
    endDate: "",
    hasCta: false,
    ctaText: "",
    ctaUrl: "",
    ctaDelay: 0,
    isActive: true,
};

export function PromoteModal({
    open,
    onOpenChange,
    editItem,
    onSubmit,
    isLoading,
}: PromoteModalProps) {
    const [form, setForm] = useState<PromoteFormData>(emptyForm);
    const isEditing = !!editItem;

    useEffect(() => {
        if (editItem) {
            setForm({
                title: editItem.title,
                description: editItem.description,
                mediaType: editItem.mediaType,
                mediaUrl: editItem.mediaUrl,
                mediaFile: null,
                startDate: editItem.startDate,
                endDate: editItem.endDate,
                hasCta: editItem.hasCta,
                ctaText: editItem.ctaText,
                ctaUrl: editItem.ctaUrl,
                ctaDelay: editItem.ctaDelay,
                isActive: editItem.isActive,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editItem, open]);

    function handleChange(
        field: keyof PromoteFormData,
        value: string | number | boolean | File | null
    ) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-add-line"} text-primary`} />
                        {isEditing ? "Editar Promoção" : "Nova Promoção"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações da promoção."
                            : "Preencha os dados para criar uma nova promoção."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Two-column grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Left column: Title, Description, Media */}
                        <PromoteFormLeft form={form} onChange={handleChange} />

                        {/* Right column: Period, CTA, Active */}
                        <PromoteFormRight form={form} onChange={handleChange} />
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
                            disabled={isLoading || !form.title.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    {isEditing ? "Salvando..." : "Criando..."}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className={isEditing ? "ri-save-line" : "ri-add-line"} />
                                    {isEditing ? "Salvar Alterações" : "Criar Promoção"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
