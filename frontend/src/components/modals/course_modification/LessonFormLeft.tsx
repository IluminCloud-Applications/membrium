import { useState, useRef, useEffect } from "react";
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
import { QuillEditor } from "@/components/shared/QuillEditor";
import { Textarea } from "@/components/ui/textarea";
import type { LessonFormData, VideoPlatform } from "@/types/course-modification";
import { integrationsService } from "@/services/integrations";
import { youtubeUploadService } from "@/services/youtubeUpload";
import { telegramService } from "@/services/telegramService";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { VTurbPicker } from "./VTurbPicker";

interface LessonFormLeftProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

export function LessonFormLeft({ form, onChange }: LessonFormLeftProps) {
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [telegramConnected, setTelegramConnected] = useState(false);
    const [vturbEnabled, setVturbEnabled] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadingTelegram, setUploadingTelegram] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const [forceShowTelegramUpload, setForceShowTelegramUpload] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const telegramFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function checkStatus() {
            try {
                const [ytStatus, integrations] = await Promise.all([
                    integrationsService.getYouTubeStatus(),
                    integrationsService.getAll(),
                ]);
                setYoutubeConnected(ytStatus.connected);
                setTelegramConnected(integrations.telegram?.connected ?? false);
                setVturbEnabled(integrations.vturb?.enabled ?? false);
            } catch { /* ignore */ }
        }
        checkStatus();
    }, []);

    async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const title = form.title.trim() || file.name.replace(/\.[^/.]+$/, "");
        setUploadingVideo(true);
        setUploadFeedback(null);

        try {
            const res = await youtubeUploadService.uploadSingle(file, title);
            if (res.success && res.video_url) {
                onChange("videoUrl", res.video_url);
                onChange("videoPlatform", "youtube");
                setUploadFeedback("✓ Vídeo enviado para o YouTube!");
            } else {
                setUploadFeedback(`✗ ${res.message}`);
            }
        } catch {
            setUploadFeedback("✗ Erro ao enviar vídeo.");
        } finally {
            setUploadingVideo(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => setUploadFeedback(null), 5000);
        }
    }

    async function handleTelegramUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const title = form.title.trim() || file.name.replace(/\.[^/.]+$/, "");
        setUploadingTelegram(true);
        setUploadFeedback(null);

        try {
            const res = await telegramService.uploadSingle(file, title);
            if (res.success && res.video_url) {
                onChange("customVideoCode", res.video_url);
                onChange("videoPlatform", "telegram");
                setUploadFeedback("✓ Vídeo enviado para o Telegram!");
                setForceShowTelegramUpload(false);
            } else {
                setUploadFeedback(`✗ ${res.message}`);
            }
        } catch {
            setUploadFeedback("✗ Erro ao enviar vídeo.");
        } finally {
            setUploadingTelegram(false);
            if (telegramFileRef.current) telegramFileRef.current.value = "";
            setTimeout(() => setUploadFeedback(null), 5000);
        }
    }

    return (
        <div className="space-y-5">
            {/* Section header */}
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <i className="ri-information-line text-primary" />
                Informações da Aula
            </h4>

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="lesson-title">
                    Título <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="lesson-title"
                    placeholder="Ex: Aula 1 - Bem-vindo"
                    value={form.title}
                    onChange={(e) => onChange("title", e.target.value)}
                    required
                />
            </div>

            {/* Description with Quill */}
            <div className="space-y-2">
                <Label>Descrição</Label>
                <QuillEditor
                    defaultValue={form.description}
                    onChange={(html) => onChange("description", html)}
                    placeholder="Descreva o conteúdo da aula..."
                />
            </div>

            {/* Video platform */}
            <div className="space-y-2">
                <Label>Plataforma de Vídeo</Label>
                <Select
                    value={form.videoPlatform}
                    onValueChange={(val: VideoPlatform) => onChange("videoPlatform", val)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="youtube">
                            <span className="flex items-center gap-2">
                                <i className="ri-youtube-line text-red-500" />
                                YouTube (recomendado)
                            </span>
                        </SelectItem>
                        {vturbEnabled && (
                            <SelectItem value="vturb">
                                <span className="flex items-center gap-2">
                                    <i className="ri-play-circle-line text-orange-500" />
                                    VTurb
                                </span>
                            </SelectItem>
                        )}
                        <SelectItem value="custom">
                            <span className="flex items-center gap-2">
                                <i className="ri-telegram-line text-blue-500" />
                                Telegram (ou Custom embed)
                            </span>
                        </SelectItem>
                        <SelectItem value="telegram">
                            <span className="flex items-center gap-2">
                                <i className="ri-telegram-fill text-blue-500" />
                                Telegram
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Video URL / VTurb picker / Custom code */}
            {form.videoPlatform === "youtube" && (
                <YouTubePlatformFields
                    form={form}
                    onChange={onChange}
                    youtubeConnected={youtubeConnected}
                    uploadingVideo={uploadingVideo}
                    uploadFeedback={uploadFeedback}
                    fileInputRef={fileInputRef}
                    onUpload={handleVideoUpload}
                />
            )}

            {form.videoPlatform === "vturb" && (
                <VTurbPicker
                    vturbVideoId={form.vturbVideoId}
                    onChange={(id) => onChange("vturbVideoId", id)}
                />
            )}

            {(form.videoPlatform === "custom" || form.videoPlatform === "telegram") && (
                <div className="space-y-4">
                    {telegramConnected && form.videoPlatform === "telegram" && (() => {
                        let telegramOriginalName = "";
                        let hasTelegramVideo = false;
                        if (form.customVideoCode) {
                            try {
                                const parsed = JSON.parse(form.customVideoCode);
                                if (parsed && typeof parsed === 'object') {
                                    hasTelegramVideo = true;
                                    telegramOriginalName = parsed.nome_original || parsed.title || "Vídeo Anexado";
                                }
                            } catch {
                                hasTelegramVideo = form.customVideoCode.trim().length > 0;
                            }
                        }

                        return (
                            <div className={`space-y-4 p-4 border rounded-lg ${hasTelegramVideo && !forceShowTelegramUpload ? 'border-primary/20 bg-primary/5' : 'border-dashed bg-muted/20'}`}>
                                {hasTelegramVideo && !forceShowTelegramUpload ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <i className="ri-vidicon-line text-blue-500 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate" title={telegramOriginalName}>
                                                {telegramOriginalName || "Vídeo Anexado"}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setForceShowTelegramUpload(true)}
                                            className="h-8 text-xs flex-shrink-0"
                                        >
                                            <i className="ri-edit-line mr-1" />
                                            Alterar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-muted-foreground">
                                                {hasTelegramVideo ? "Substituir vídeo no Telegram:" : "Envie direto para o Telegram:"}
                                            </Label>
                                            {hasTelegramVideo && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setForceShowTelegramUpload(false)}
                                                    className="h-6 text-xs px-2"
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            ref={telegramFileRef}
                                            type="file"
                                            accept="video/*"
                                            onChange={handleTelegramUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => telegramFileRef.current?.click()}
                                            disabled={uploadingTelegram}
                                            className="w-full gap-2 text-xs"
                                        >
                                            {uploadingTelegram ? (
                                                <>
                                                    <i className="ri-loader-4-line animate-spin" />
                                                    Enviando para o Telegram...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-telegram-line text-blue-500" />
                                                    {hasTelegramVideo ? "Fazer upload do novo vídeo" : "Upload para Telegram"}
                                                </>
                                            )}
                                        </Button>
                                        {uploadFeedback && form.videoPlatform === "telegram" && (
                                            <p className={`text-xs animate-fade-in ${uploadFeedback.startsWith("✓")
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-500"
                                                }`}>
                                                {uploadFeedback}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    {form.videoPlatform === "telegram" ? (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="advanced" className="border-none">
                                <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline hover:text-primary transition-colors">
                                    <span className="flex items-center gap-2">
                                        <i className="ri-settings-3-line text-muted-foreground" />
                                        Configurações Avançadas (JSON Embed)
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pt-2">
                                        <Textarea
                                            id="lesson-custom-code-telegram"
                                            placeholder="JSON do Telegram gerado automaticamente..."
                                            value={form.customVideoCode}
                                            onChange={(e) => onChange("customVideoCode", e.target.value)}
                                            rows={4}
                                            className="font-mono text-xs resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Não altere este código a menos que saiba o que está fazendo.
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="lesson-custom-code">URL do Vídeo Telegram ou Código Embed</Label>
                            <Textarea
                                id="lesson-custom-code"
                                placeholder="..."
                                value={form.customVideoCode}
                                onChange={(e) => onChange("customVideoCode", e.target.value)}
                                rows={4}
                                className="font-mono text-xs resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Edite apenas se souber o que está fazendo (URL do stream ou código embed customizado).
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ---- YouTube platform fields ---- */

interface YouTubePlatformFieldsProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
    youtubeConnected: boolean;
    uploadingVideo: boolean;
    uploadFeedback: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function YouTubePlatformFields({
    form, onChange, youtubeConnected, uploadingVideo, uploadFeedback, fileInputRef, onUpload,
}: YouTubePlatformFieldsProps) {
    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor="lesson-video-url">URL do Vídeo</Label>
                <div className="relative">
                    <i className="ri-youtube-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        id="lesson-video-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={form.videoUrl}
                        onChange={(e) => onChange("videoUrl", e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {youtubeConnected && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            ou envie direto para o YouTube:
                        </span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={onUpload}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="w-full gap-2 border-dashed text-xs"
                    >
                        {uploadingVideo ? (
                            <>
                                <i className="ri-loader-4-line animate-spin" />
                                Enviando para YouTube...
                            </>
                        ) : (
                            <>
                                <i className="ri-upload-cloud-2-line" />
                                Upload para YouTube
                            </>
                        )}
                    </Button>
                    {uploadFeedback && (
                        <p className={`text-xs animate-fade-in ${uploadFeedback.startsWith("✓")
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500"
                            }`}>
                            {uploadFeedback}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
