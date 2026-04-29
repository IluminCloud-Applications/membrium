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
import { VTurbPicker } from "./VTurbPicker";

interface LessonFormLeftProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

export function LessonFormLeft({ form, onChange }: LessonFormLeftProps) {
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [vturbEnabled, setVturbEnabled] = useState(false);
    const [cloudflareEnabled, setCloudflareEnabled] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function checkStatus() {
            try {
                const [ytStatus, integrations] = await Promise.all([
                    integrationsService.getYouTubeStatus(),
                    integrationsService.getAll(),
                ]);
                setYoutubeConnected(ytStatus.connected);
                setVturbEnabled(integrations.vturb?.enabled ?? false);
                setCloudflareEnabled(integrations.cloudflare_r2?.enabled ?? false);
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
                        {cloudflareEnabled && (
                            <SelectItem value="cloudflare">
                                <span className="flex items-center gap-2">
                                    <i className="ri-cloud-line text-orange-600" />
                                    Cloudflare R2
                                </span>
                            </SelectItem>
                        )}
                        <SelectItem value="custom">
                            <span className="flex items-center gap-2">
                                <i className="ri-code-s-slash-line text-blue-500" />
                                Custom Embed
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

            {form.videoPlatform === "cloudflare" && (
                <CloudflarePlatformFields form={form} onChange={onChange} />
            )}

            {form.videoPlatform === "custom" && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="lesson-custom-code">Código Embed</Label>
                        <Textarea
                            id="lesson-custom-code"
                            placeholder="..."
                            value={form.customVideoCode}
                            onChange={(e) => onChange("customVideoCode", e.target.value)}
                            rows={4}
                            className="font-mono text-xs resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Cole o código HTML do seu vídeo embed.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Cloudflare platform fields ---- */

interface CloudflarePlatformFieldsProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

function CloudflarePlatformFields({ form, onChange }: CloudflarePlatformFieldsProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const file = form.cloudflareFile;
    const existingUrl = form.cloudflareUrl;

    function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        onChange("cloudflareFile", f);
    }

    function handleClear() {
        onChange("cloudflareFile", null);
        if (fileRef.current) fileRef.current.value = "";
    }

    return (
        <div className="space-y-3">
            <Label>Vídeo</Label>
            <input
                ref={fileRef}
                type="file"
                accept="video/*"
                onChange={handlePick}
                className="hidden"
            />

            {file ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <i className="ri-film-line text-orange-600 text-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB · será enviado ao R2 ao criar a aula
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <i className="ri-close-line text-lg" />
                    </button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="w-full gap-2 border-dashed"
                >
                    <i className="ri-upload-cloud-2-line text-orange-600" />
                    {existingUrl ? "Trocar vídeo" : "Selecionar vídeo"}
                </Button>
            )}

            {existingUrl && !file && (
                <p className="text-xs text-muted-foreground break-all">
                    <i className="ri-link mr-1" />
                    {existingUrl}
                </p>
            )}

            <p className="text-[11px] text-muted-foreground">
                O upload é feito direto para o seu bucket R2 — os bytes não passam por este servidor.
            </p>
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
