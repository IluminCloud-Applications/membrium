import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ShowcaseFormInfoProps {
    title: string;
    description: string;
    imagePreview: string | null;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onUploadClick: () => void;
    onRemoveImage: () => void;
}

export function ShowcaseFormInfo({
    title,
    description,
    imagePreview,
    onTitleChange,
    onDescriptionChange,
    onUploadClick,
    onRemoveImage,
}: ShowcaseFormInfoProps) {
    return (
        <div className="space-y-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-information-line" />
                Informações
            </p>

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="showcase-title">
                    Título <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="showcase-title"
                    placeholder="Ex: Marketing Digital Avançado"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="showcase-description">
                    Descrição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="showcase-description"
                    placeholder="Descreva brevemente o conteúdo..."
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={3}
                    required
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <Label>
                    Imagem de Capa <span className="text-destructive">*</span>
                </Label>

                {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={onRemoveImage}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        >
                            <i className="ri-close-line text-sm" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <i className="ri-upload-cloud-2-line text-primary text-lg" />
                        </div>
                        <span className="text-sm font-medium">Clique para enviar</span>
                        <span className="text-xs text-muted-foreground">
                            PNG, JPG ou WebP (16:9)
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
