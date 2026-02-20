import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { PromoteMediaType } from "@/types/promote";

interface PromoteMediaSectionProps {
    mediaType: PromoteMediaType;
    mediaUrl: string;
    onMediaTypeChange: (type: PromoteMediaType) => void;
    onMediaUrlChange: (url: string) => void;
    onMediaFileChange: (file: File | null) => void;
}

export function PromoteMediaSection({
    mediaType,
    mediaUrl,
    onMediaTypeChange,
    onMediaUrlChange,
    onMediaFileChange,
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
                                onClick={handleRemoveImage}
                                className="absolute top-6 right-6 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm hover:opacity-90 transition-opacity"
                            >
                                <i className="ri-close-line" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Video URL */}
            {mediaType === "video" && (
                <div className="space-y-2">
                    <Label htmlFor="promote-video-url">
                        URL do Vídeo <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <i className="ri-youtube-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                        <Input
                            id="promote-video-url"
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={mediaUrl}
                            onChange={(e) => onMediaUrlChange(e.target.value)}
                            className="pl-9"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cole a URL do YouTube ou Vimeo.
                    </p>
                </div>
            )}
        </div>
    );
}
