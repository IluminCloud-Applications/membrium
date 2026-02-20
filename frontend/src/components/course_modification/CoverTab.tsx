import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CourseCover } from "@/types/course-modification";

interface CoverTabProps {
    cover: CourseCover;
    onCoverChange: (type: "desktop" | "mobile", file: File | null) => void;
    onCoverDelete: (type: "desktop" | "mobile") => void;
}

export function CoverTab({ cover, onCoverChange, onCoverDelete }: CoverTabProps) {
    const desktopRef = useRef<HTMLInputElement>(null);
    const mobileRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <i className="ri-information-line text-blue-600 text-lg" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Sobre o Cover</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            O cover é a imagem de apresentação que aparece acima dos módulos do curso.
                            Você pode definir um cover diferente para desktop e mobile para melhor experiência.
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop cover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CoverUpload
                    label="Cover Desktop"
                    recommendation="Recomendado: 16:9 (1920×1080)"
                    icon="ri-computer-line"
                    coverUrl={cover.desktop}
                    inputRef={desktopRef}
                    onFileChange={(file) => onCoverChange("desktop", file)}
                    onDelete={() => onCoverDelete("desktop")}
                />

                <CoverUpload
                    label="Cover Mobile"
                    recommendation="Recomendado: 9:16 (600×1050)"
                    icon="ri-smartphone-line"
                    coverUrl={cover.mobile}
                    inputRef={mobileRef}
                    onFileChange={(file) => onCoverChange("mobile", file)}
                    onDelete={() => onCoverDelete("mobile")}
                />
            </div>
        </div>
    );
}

/* ---- Individual cover upload card ---- */

interface CoverUploadProps {
    label: string;
    recommendation: string;
    icon: string;
    coverUrl: string | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (file: File | null) => void;
    onDelete: () => void;
}

function CoverUpload({
    label,
    recommendation,
    icon,
    coverUrl,
    inputRef,
    onFileChange,
    onDelete,
}: CoverUploadProps) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        onFileChange(file);
    }

    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
                <i className={`${icon} text-primary text-lg`} />
                <Label className="text-sm font-semibold">{label}</Label>
            </div>

            {/* Preview or upload area */}
            {coverUrl ? (
                <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden border bg-muted">
                        <img
                            src={coverUrl}
                            alt={label}
                            className="w-full h-40 object-cover"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            className="flex-1 gap-1.5"
                        >
                            <i className="ri-image-edit-line" />
                            Alterar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDelete}
                            className="gap-1.5 text-destructive hover:text-destructive"
                        >
                            <i className="ri-delete-bin-line" />
                            Remover
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/2 transition-all cursor-pointer"
                >
                    <i className="ri-upload-cloud-2-line text-3xl text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Clique para enviar
                    </p>
                    <p className="text-xs text-muted-foreground/70">{recommendation}</p>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />
        </div>
    );
}
