import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { courseModificationService } from "@/services/courseModification";
import { toast } from "sonner";

interface ImportCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ImportCourseModal({ open, onOpenChange, onSuccess }: ImportCourseModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (selected) validateAndSetFile(selected);
    }

    function validateAndSetFile(f: File) {
        if (!f.name.endsWith('.zip')) {
            toast.error("Selecione um arquivo .zip válido");
            return;
        }
        setFile(f);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) validateAndSetFile(dropped);
    }

    async function handleImport() {
        if (!file) return;
        setImporting(true);
        try {
            const result = await courseModificationService.importCourse(file);
            toast.success(result.message || "Curso importado com sucesso!");
            onOpenChange(false);
            resetState();
            onSuccess();
        } catch (err) {
            console.error("Erro ao importar curso:", err);
            toast.error("Erro ao importar curso. Verifique o arquivo.");
        } finally {
            setImporting(false);
        }
    }

    function resetState() {
        setFile(null);
        setDragOver(false);
    }

    function handleClose(isOpen: boolean) {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-upload-2-line text-primary" />
                        Importar Curso
                    </DialogTitle>
                    <DialogDescription>
                        Selecione um arquivo <code>.zip</code> exportado anteriormente para
                        importar um curso completo com módulos, aulas e arquivos.
                    </DialogDescription>
                </DialogHeader>

                {/* Drop zone */}
                <div
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors duration-200
                        ${dragOver
                            ? "border-primary bg-primary/5"
                            : file
                                ? "border-green-500 bg-green-500/5"
                                : "border-muted-foreground/25 hover:border-primary/50"
                        }
                    `}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {file ? (
                        <div className="space-y-2">
                            <i className="ri-file-zip-line text-3xl text-green-500" />
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="text-xs text-muted-foreground"
                            >
                                <i className="ri-close-line mr-1" />
                                Remover
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <i className="ri-upload-cloud-2-line text-3xl text-muted-foreground" />
                            <p className="text-sm font-medium">
                                Arraste o arquivo aqui ou clique para selecionar
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Apenas arquivos .zip exportados
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={importing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="gap-2"
                    >
                        {importing ? (
                            <>
                                <i className="ri-loader-4-line animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <i className="ri-upload-2-line" />
                                Importar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
