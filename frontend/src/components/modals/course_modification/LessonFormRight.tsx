import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { LessonFormData } from "@/types/course-modification";

interface LessonFormRightProps {
    form: LessonFormData;
    onChange: (field: keyof LessonFormData, value: unknown) => void;
}

export function LessonFormRight({ form, onChange }: LessonFormRightProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        onChange("attachments", [...form.attachments, ...files]);
    }

    function removeNewFile(index: number) {
        const updated = form.attachments.filter((_, i) => i !== index);
        onChange("attachments", updated);
    }

    function removeExistingFile(id: number) {
        const updated = form.existingAttachments.filter((a) => a.id !== id);
        onChange("existingAttachments", updated);
    }

    return (
        <div className="space-y-5">
            {/* CTA section (now first) */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <i className="ri-cursor-line text-primary" />
                    Call to Action (CTA)
                </h4>

                {/* CTA toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Adicionar CTA</Label>
                        <p className="text-xs text-muted-foreground">
                            Exibe um botão de ação durante a aula.
                        </p>
                    </div>
                    <Switch
                        checked={form.hasCta}
                        onCheckedChange={(val) => onChange("hasCta", val)}
                    />
                </div>

                {/* CTA fields */}
                {form.hasCta && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                            <Label htmlFor="lesson-cta-text">Texto do Botão</Label>
                            <Input
                                id="lesson-cta-text"
                                placeholder="Ex: Garanta sua vaga!"
                                value={form.ctaText}
                                onChange={(e) => onChange("ctaText", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lesson-cta-url">Link do Botão</Label>
                            <div className="relative">
                                <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                                <Input
                                    id="lesson-cta-url"
                                    type="url"
                                    placeholder="https://..."
                                    value={form.ctaUrl}
                                    onChange={(e) => onChange("ctaUrl", e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lesson-cta-delay">Delay do Botão (segundos)</Label>
                            <Input
                                id="lesson-cta-delay"
                                type="number"
                                min={0}
                                value={form.ctaDelay}
                                onChange={(e) => onChange("ctaDelay", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Se 0, o botão será exibido imediatamente. Caso contrário,
                                aparecerá após o tempo especificado.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Attachments (now after CTA) */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <i className="ri-attachment-2 text-primary" />
                    Anexos
                </h4>

                {/* Existing attachments */}
                {form.existingAttachments.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Arquivos existentes</Label>
                        {form.existingAttachments.map((att) => (
                            <AttachmentRow
                                key={att.id}
                                name={att.name}
                                size={att.size}
                                onRemove={() => removeExistingFile(att.id)}
                            />
                        ))}
                    </div>
                )}

                {/* New attachments */}
                {form.attachments.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Novos arquivos</Label>
                        {form.attachments.map((file, index) => (
                            <AttachmentRow
                                key={`new-${index}`}
                                name={file.name}
                                size={formatFileSize(file.size)}
                                onRemove={() => removeNewFile(index)}
                                isNew
                            />
                        ))}
                    </div>
                )}

                {/* Upload button */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    className="w-full gap-2"
                >
                    <i className="ri-upload-2-line" />
                    Anexar Arquivos
                </Button>

                <input
                    ref={fileRef}
                    type="file"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                />
            </div>
        </div>
    );
}

/* ---- Attachment row ---- */

interface AttachmentRowProps {
    name: string;
    size: string;
    onRemove: () => void;
    isNew?: boolean;
}

function AttachmentRow({ name, size, onRemove, isNew }: AttachmentRowProps) {
    return (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
            <i className="ri-file-line text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground">{size}</p>
            </div>
            {isNew && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                    Novo
                </Badge>
            )}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
                <i className="ri-close-line text-sm" />
            </Button>
        </div>
    );
}

/* ---- Utility ---- */

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
