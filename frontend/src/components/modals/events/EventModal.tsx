import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EventForm } from "./EventForm";
import type { EventItem, EventMediaType } from "@/types/event";

export interface EventFormData {
    title: string;
    description: string;
    mediaType: EventMediaType;
    mediaUrl: string;
    mediaFile: File | null;
    htmlContent: string;
    callLink: string;
    eventDate: string;
    sendEmail: boolean;
    sendWhatsapp: boolean;
    isActive: boolean;
}

interface EventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: EventItem | null;
    onSubmit: (data: EventFormData) => void;
    isLoading?: boolean;
}

function getTodayISO(): string {
    const now = new Date();
    return now.toISOString();
}

const emptyForm: EventFormData = {
    title: "",
    description: "",
    mediaType: "default",
    mediaUrl: "",
    mediaFile: null,
    htmlContent: "",
    callLink: "",
    eventDate: getTodayISO(),
    sendEmail: false,
    sendWhatsapp: false,
    isActive: true,
};

export function EventModal({
    open,
    onOpenChange,
    editItem,
    onSubmit,
    isLoading,
}: EventModalProps) {
    const [form, setForm] = useState<EventFormData>(emptyForm);
    const isEditing = !!editItem;

    useEffect(() => {
        if (editItem) {
            setForm({
                title: editItem.title,
                description: editItem.description,
                mediaType: editItem.mediaType,
                mediaUrl: editItem.mediaUrl,
                mediaFile: null,
                htmlContent: editItem.htmlContent,
                callLink: editItem.callLink,
                eventDate: editItem.eventDate,
                sendEmail: editItem.sendEmail,
                sendWhatsapp: editItem.sendWhatsapp,
                isActive: editItem.isActive,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editItem, open]);

    function handleChange(
        field: keyof EventFormData,
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
                        {isEditing ? "Editar Evento" : "Novo Evento"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do evento."
                            : "Preencha os dados para criar um novo evento."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <EventForm form={form} onChange={handleChange} />

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
                                    {isEditing ? "Salvar Alterações" : "Criar Evento"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
