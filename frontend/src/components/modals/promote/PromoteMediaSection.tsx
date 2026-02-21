import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PromoteMediaType, PromoteVideoSource } from "@/types/promote";

interface PromoteMediaSectionProps {
    mediaType: PromoteMediaType;
    mediaUrl: string;
    videoSource: PromoteVideoSource;
    onMediaTypeChange: (type: PromoteMediaType) => void;
    onMediaUrlChange: (url: string) => void;
    onMediaFileChange: (file: File | null) => void;
    onVideoSourceChange: (source: PromoteVideoSource) => void;
}

export function PromoteMediaSection({
    mediaType,
    mediaUrl,
    videoSource,
    onMediaTypeChange,
    onMediaUrlChange,
    onMediaFileChange,
    onVideoSourceChange,
}: PromoteMediaSectionProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            onMediaFileChange(file);
            setPreview(URL.createObjectURL(file));
        }
    }

    function handleRemoveImage() {
        onMediaFileChange(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleMediaTypeSwitch(type: PromoteMediaType) {
        onMediaTypeChange(type);
        onMediaUrlChange("");
        onMediaFileChange(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <i className="ri-image-line text-primary" />
                Mídia
            </h4>

            {/* Media type toggle */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => handleMediaTypeSwitch("image")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${mediaType === "image"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                >
                    <i className="ri-image-line" />
                    Imagem
                </button>
                <button
                    type="button"
                    onClick={() => handleMediaTypeSwitch("video")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${mediaType === "video"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                >
                    <i className="ri-video-line" />
                    Vídeo
                </button>
            </div>

            {/* Image upload */}
            {mediaType === "image" && (
                <ImageUpload
                    preview={preview}
                    fileInputRef={fileInputRef}
                    onImageChange={handleImageChange}
                    onRemoveImage={handleRemoveImage}
                />
            )}

            {/* Video source + input */}
            {mediaType === "video" && (
                <VideoInput
                    mediaUrl={mediaUrl}
                    videoSource={videoSource}
                    onMediaUrlChange={onMediaUrlChange}
                    onVideoSourceChange={onVideoSourceChange}
                />
            )}
        </div>
    );
}

/* ---- Image Upload Sub-Component ---- */

interface ImageUploadProps {
    preview: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
}

function ImageUpload({ preview, fileInputRef, onImageChange, onRemoveImage }: ImageUploadProps) {
    return (
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
                        onChange={onImageChange}
                        className="hidden"
                    />
                </div>

                {preview && (
                    <button
                        type="button"
                        onClick={onRemoveImage}
                        className="absolute top-6 right-6 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm hover:opacity-90 transition-opacity"
                    >
                        <i className="ri-close-line" />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ---- Video Input Sub-Component ---- */

const videoSourceOptions: { value: PromoteVideoSource; label: string; icon: string }[] = [
    { value: "youtube", label: "YouTube", icon: "ri-youtube-line" },
    { value: "vimeo", label: "Vimeo", icon: "ri-vimeo-line" },
    { value: "custom", label: "Externo", icon: "ri-code-s-slash-line" },
];

interface VideoInputProps {
    mediaUrl: string;
    videoSource: PromoteVideoSource;
    onMediaUrlChange: (url: string) => void;
    onVideoSourceChange: (source: PromoteVideoSource) => void;
}

function VideoInput({
    mediaUrl,
    videoSource,
    onMediaUrlChange,
    onVideoSourceChange,
}: VideoInputProps) {
    const isCustom = videoSource === "custom";

    return (
        <div className="space-y-3 animate-fade-in">
            {/* Video source selector */}
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Origem do Vídeo</Label>
                <div className="flex gap-2">
                    {videoSourceOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onVideoSourceChange(opt.value);
                                onMediaUrlChange("");
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${videoSource === opt.value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                        >
                            <i className={opt.icon} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* URL or embed input */}
            {isCustom ? (
                <div className="space-y-2">
                    <Label htmlFor="promote-video-embed">
                        Código Embed <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="promote-video-embed"
                        placeholder={'<iframe src="https://player.vturb.com.br/..." ...></iframe>'}
                        value={mediaUrl}
                        onChange={(e) => onMediaUrlChange(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Cole o código embed do VTurb, Panda Video ou outro player externo.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="promote-video-url">
                        URL do Vídeo <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <i className={`${videoSource === "youtube" ? "ri-youtube-line" : "ri-vimeo-line"} absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm`} />
                        <Input
                            id="promote-video-url"
                            type="url"
                            placeholder={
                                videoSource === "youtube"
                                    ? "https://youtube.com/watch?v=..."
                                    : "https://vimeo.com/..."
                            }
                            value={mediaUrl}
                            onChange={(e) => onMediaUrlChange(e.target.value)}
                            className="pl-9"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cole a URL do {videoSource === "youtube" ? "YouTube" : "Vimeo"}.
                    </p>
                </div>
            )}

            {/* Custom warning */}
            {isCustom && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                    <i className="ri-alert-line text-amber-500 text-base mt-0.5" />
                    <div className="space-y-0.5">
                        <p className="font-medium text-amber-600">Vídeo Externo</p>
                        <p className="text-muted-foreground">
                            Ao usar um player externo, o CTA (botão de ação) será
                            desabilitado, pois não é possível controlar a interação com
                            o vídeo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
