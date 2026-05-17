import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { EventFormData } from "./EventModal";

interface EventFormProps {
    form: EventFormData;
    onChange: (field: keyof EventFormData, value: string | number | boolean | File | null) => void;
}

function isoToDate(iso: string): Date | undefined {
    if (!iso) return undefined;
    return new Date(iso);
}

function dateToIso(date: Date | undefined): string {
    if (!date) return "";
    return date.toISOString();
}

function getToday(): Date {
    return new Date();
}

export function EventForm({ form, onChange }: EventFormProps) {
    const today = getToday();
    const eventDate = isoToDate(form.eventDate);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Derived hour/minute strings
    const currentHour = eventDate ? String(eventDate.getHours()).padStart(2, "0") : "12";
    const currentMinute = eventDate ? String(eventDate.getMinutes()).padStart(2, "0") : "00";

    // Set initial preview if there's a mediaUrl but no new file yet
    useEffect(() => {
        if (form.mediaUrl && !form.mediaFile && form.mediaType === "image") {
            setPreview(form.mediaUrl.startsWith("http") ? form.mediaUrl : `/static/uploads/${form.mediaUrl}`);
        } else if (!form.mediaFile) {
            setPreview(null);
        }
    }, [form.mediaUrl, form.mediaFile, form.mediaType]);

    function handleEventDateChange(date: Date | undefined) {
        if (!date) {
            onChange("eventDate", "");
            return;
        }
        // Preserve current time when date changes
        date.setHours(parseInt(currentHour, 10));
        date.setMinutes(parseInt(currentMinute, 10));
        onChange("eventDate", dateToIso(date));
    }

    function handleTimeChange(type: "hour" | "minute", val: string) {
        const d = eventDate || getToday();
        if (type === "hour") d.setHours(parseInt(val, 10));
        if (type === "minute") d.setMinutes(parseInt(val, 10));
        onChange("eventDate", dateToIso(d));
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            onChange("mediaFile", file);
            setPreview(URL.createObjectURL(file));
        }
    }

    function handleRemoveImage() {
        onChange("mediaFile", null);
        onChange("mediaUrl", "");
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleMediaTypeSwitch(type: "default" | "image" | "html") {
        onChange("mediaType", type);
        // We do not reset mediaUrl/mediaFile here so we don't lose data if they switch back and forth
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Informações Básicas */}
            <div className="space-y-5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <i className="ri-information-line text-primary" />
                    Informações Básicas
                </h4>

                <div className="space-y-2">
                    <Label htmlFor="event-title">
                        Título <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="event-title"
                        placeholder="Ex: Mentoria ao Vivo"
                        value={form.title}
                        onChange={(e) => onChange("title", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="event-description">
                        Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="event-description"
                        placeholder="Descreva os detalhes do evento..."
                        value={form.description}
                        onChange={(e) => onChange("description", e.target.value)}
                        rows={3}
                        required
                    />
                </div>

                {/* Media Section */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-image-line text-primary" />
                        Mídia do Evento
                    </h4>

                    {/* Media type toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleMediaTypeSwitch("default")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${form.mediaType === "default"
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                        >
                            <i className="ri-layout-top-line" />
                            Padrão
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMediaTypeSwitch("image")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${form.mediaType === "image"
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                        >
                            <i className="ri-image-line" />
                            Imagem
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMediaTypeSwitch("html")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${form.mediaType === "html"
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                        >
                            <i className="ri-html5-line" />
                            HTML
                        </button>
                    </div>

                    {/* Image upload */}
                    {form.mediaType === "image" && (
                        <div className="space-y-2">
                            <div className="relative">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors overflow-hidden"
                                >
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full aspect-video object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="py-6 space-y-2">
                                            <i className="ri-image-add-line text-3xl text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Clique para selecionar uma imagem
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Recomendado: 16:9 (1280×720)
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>

                                {preview && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage();
                                        }}
                                        className="absolute top-6 right-6 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm hover:opacity-90 transition-opacity"
                                    >
                                        <i className="ri-close-line" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Default Preview */}
                    {form.mediaType === "default" && (
                        <div className="space-y-2 animate-fade-in">
                            <div className="w-full aspect-video bg-muted/30 rounded-xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed">
                                <i className="ri-calendar-event-line text-4xl text-primary mb-2" />
                                <h3 className="font-semibold text-foreground">Visualização Padrão</h3>
                                <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                                    Nesta opção, o modal não exibirá mídias, focando totalmente no título, descrição e contagem regressiva do evento.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* HTML input */}
                    {form.mediaType === "html" && (
                        <div className="space-y-2 animate-fade-in">
                            <Label htmlFor="event-html">
                                Código HTML <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="event-html"
                                placeholder="<iframe src='...' />"
                                value={form.htmlContent}
                                onChange={(e) => onChange("htmlContent", e.target.value)}
                                rows={5}
                                className="font-mono text-xs max-h-[150px] overflow-y-auto"
                                required={form.mediaType === "html"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Cole o código embed (ex: contagem regressiva personalizada, player de vídeo).
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Agendamento e Notificações */}
            <div className="space-y-5">
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-calendar-line text-primary" />
                        Agendamento
                    </h4>

                    <div className="space-y-2">
                        <Label htmlFor="event-date">
                            Data e Hora do Evento <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <DatePicker
                                    id="event-date"
                                    value={eventDate}
                                    onChange={handleEventDateChange}
                                    minDate={today}
                                    placeholder="Selecione a data"
                                    required
                                />
                            </div>
                            <div className="w-[80px]">
                                <Select value={currentHour} onValueChange={(v) => handleTimeChange("hour", v)}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="HH" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] rounded-xl">
                                        {Array.from({ length: 24 }).map((_, i) => {
                                            const h = String(i).padStart(2, "0");
                                            return (
                                                <SelectItem key={h} value={h} className="rounded-lg">
                                                    {h}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <span className="text-muted-foreground self-center font-bold">:</span>
                            <div className="w-[80px]">
                                <Select value={currentMinute} onValueChange={(v) => handleTimeChange("minute", v)}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] rounded-xl">
                                        {Array.from({ length: 60 }).map((_, i) => {
                                            const m = String(i).padStart(2, "0");
                                            return (
                                                <SelectItem key={m} value={m} className="rounded-lg">
                                                    {m}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="event-call">Link da Chamada (Opcional)</Label>
                        <div className="relative">
                            <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                id="event-call"
                                type="url"
                                placeholder="https://zoom.us/j/..."
                                value={form.callLink}
                                onChange={(e) => onChange("callLink", e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-notification-3-line text-primary" />
                        Notificações (30 min antes)
                    </h4>

                    <div className="space-y-4 rounded-xl border p-4 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="event-email" className="font-medium flex items-center gap-2">
                                    <i className="ri-mail-send-line text-primary" />
                                    Enviar E-mail
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Disparar email de lembrete
                                </p>
                            </div>
                            <Switch
                                id="event-email"
                                checked={form.sendEmail}
                                onCheckedChange={(checked) => onChange("sendEmail", checked)}
                            />
                        </div>

                        <div className="h-px bg-border/50" />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="event-whatsapp" className="font-medium flex items-center gap-2">
                                    <i className="ri-whatsapp-line text-emerald-500" />
                                    Enviar WhatsApp
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Disparar mensagem no WhatsApp
                                </p>
                            </div>
                            <Switch
                                id="event-whatsapp"
                                checked={form.sendWhatsapp}
                                onCheckedChange={(checked) => onChange("sendWhatsapp", checked)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
