import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { customizationService } from "@/services/customization";

interface ImageUploadFieldProps {
    label: string;
    hint: string;
    currentFile: string | null;
    onUploaded: (filename: string) => void;
    onRemoved: () => void;
}

export function ImageUploadField({
    label,
    hint,
    currentFile,
    onUploaded,
    onRemoved,
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await customizationService.uploadImage(file);
            if (res.success) onUploaded(res.filename);
        } catch { /* silent */ } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    async function handleRemove() {
        if (currentFile) {
            try { await customizationService.deleteImage(currentFile); } catch { /* silent */ }
        }
        onRemoved();
    }

    const imageUrl = currentFile ? `/static/uploads/${currentFile}` : null;

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {imageUrl ? (
                <div className="relative group">
                    <img
                        src={imageUrl}
                        alt={label}
                        className="w-full max-h-32 object-contain rounded-lg border border-border bg-muted/30"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                            <i className="ri-upload-2-line mr-1" /> Trocar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleRemove}>
                            <i className="ri-delete-bin-line mr-1" /> Remover
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer"
                >
                    {uploading ? (
                        <i className="ri-loader-4-line animate-spin text-xl" />
                    ) : (
                        <>
                            <i className="ri-upload-cloud-2-line text-xl" />
                            <span className="text-xs">Clique para enviar</span>
                        </>
                    )}
                </button>
            )}
            <p className="text-xs text-muted-foreground">{hint}</p>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
    );
}
