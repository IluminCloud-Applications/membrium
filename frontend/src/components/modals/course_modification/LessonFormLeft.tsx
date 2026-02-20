import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface LessonFormLeftProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

export function LessonFormLeft({ form, onChange }: LessonFormLeftProps) {
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
