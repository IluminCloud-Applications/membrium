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
import type { LessonFormData, VideoPlatform } from "@/types/course-modification";
import { Textarea } from "@/components/ui/textarea";
import { integrationsService } from "@/services/integrations";
import { youtubeUploadService } from "@/services/youtubeUpload";

interface LessonFormLeftProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

export function LessonFormLeft({ form, onChange }: LessonFormLeftProps) {
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function check() {
            try {
                const res = await integrationsService.getYouTubeStatus();
                setYoutubeConnected(res.connected);
            } catch { /* ignore */ }
        }
        check();
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
                        <SelectItem value="custom">
                            <span className="flex items-center gap-2">
                                <i className="ri-code-s-slash-line" />
                                Custom (código embed)
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Video URL / Custom code */}
            {form.videoPlatform === "youtube" ? (
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

                    {/* YouTube upload button - only shown when connected */}
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
                                onChange={handleVideoUpload}
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
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="lesson-custom-code">Código do Vídeo</Label>
                    <Textarea
                        id="lesson-custom-code"
                        placeholder="Cole aqui o código embed do vídeo..."
                        value={form.customVideoCode}
                        onChange={(e) => onChange("customVideoCode", e.target.value)}
                        rows={4}
                        className="font-mono text-xs resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        Cole o código HTML/embed completo do seu player de vídeo.
                    </p>
                </div>
            )}
        </div>
    );
}
