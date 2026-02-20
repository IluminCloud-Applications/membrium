import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PromoteMediaSection } from "./PromoteMediaSection";
import type { PromoteFormData } from "./PromoteModal";
import type { PromoteMediaType } from "@/types/promote";

interface PromoteFormLeftProps {
    form: PromoteFormData;
    onChange: (field: keyof PromoteFormData, value: string | number | boolean | File | null) => void;
}

export function PromoteFormLeft({ form, onChange }: PromoteFormLeftProps) {
    return (
        <div className="space-y-5">
            {/* Section header */}
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <i className="ri-information-line text-primary" />
                Informações Básicas
            </h4>

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="promote-title">
                    Título <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="promote-title"
                    placeholder="Ex: Super Promoção de Verão"
                    value={form.title}
                    onChange={(e) => onChange("title", e.target.value)}
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="promote-description">
                    Descrição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="promote-description"
                    placeholder="Descreva os detalhes da promoção..."
                    value={form.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    rows={3}
                    required
                />
            </div>

            {/* Media */}
            <PromoteMediaSection
                mediaType={form.mediaType}
                mediaUrl={form.mediaUrl}
                onMediaTypeChange={(type: PromoteMediaType) => onChange("mediaType", type)}
                onMediaUrlChange={(url: string) => onChange("mediaUrl", url)}
                onMediaFileChange={(file: File | null) => onChange("mediaFile", file)}
            />
        </div>
    );
}
