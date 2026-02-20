import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface YouTubeImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (url: string, provider: string) => void;
}

export function YouTubeImportModal({
    open,
    onOpenChange,
    onImport,
}: YouTubeImportModalProps) {
    const [url, setUrl] = useState("");
    const [provider, setProvider] = useState("groq");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!url.trim()) {
            setError("Insira a URL do vídeo.");
            return;
        }
        setError("");
        setIsLoading(true);
        // Simulate — real implementation would call API
        setTimeout(() => {
            onImport(url, provider);
            setIsLoading(false);
            setUrl("");
            setProvider("groq");
        }, 1500);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-youtube-line text-red-500" />
                        Importar do YouTube
                    </DialogTitle>
                    <DialogDescription>
                        Cole a URL do vídeo para importar a transcrição automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <Label>URL do Vídeo</Label>
                        <Input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="h-9"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <Label>Provedor de IA</Label>
                        <Select
                            value={provider}
                            onValueChange={setProvider}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="groq" className="rounded-lg">
                                    GROQ
                                </SelectItem>
                                <SelectItem value="openai" className="rounded-lg">
                                    OpenAI
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            <i className="ri-loader-4-line animate-spin text-primary" />
                            <div>
                                <p className="text-sm font-medium">
                                    Processando transcrição...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Isso pode levar alguns minutos.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            <i className="ri-error-warning-line" />
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Importando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <i className="ri-download-line" />
                                    Importar
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
