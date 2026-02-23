import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { WebhookPlatformList } from "./WebhookPlatformList";
import { WebhookLinkView } from "./WebhookLinkView";
import { apiClient } from "@/services/apiClient";
import type { Course } from "@/types/course";

export interface WebhookPlatform {
    id: string;
    name: string;
    logo: string;
}

interface PlatformsResponse {
    platforms: WebhookPlatform[];
    base_url: string;
}

interface WebhookModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: Course | null;
}

export function WebhookModal({ open, onOpenChange, course }: WebhookModalProps) {
    const [platforms, setPlatforms] = useState<WebhookPlatform[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<WebhookPlatform | null>(null);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        if (open) {
            apiClient.get<PlatformsResponse>("/webhook/platforms")
                .then((data) => {
                    setPlatforms(data.platforms);
                    setBaseUrl(data.base_url);
                })
                .catch((err) => console.error("Erro ao carregar plataformas:", err));
        } else {
            setSelectedPlatform(null);
        }
    }, [open]);

    const httpsBaseUrl = baseUrl.replace(/^http:\/\//, "https://");
    const webhookUrl = selectedPlatform && course
        ? `${httpsBaseUrl}/webhook/${selectedPlatform.id}/${course.uuid}`
        : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-webhook-line text-primary" />
                        {selectedPlatform ? selectedPlatform.name : "Configurar Webhook"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedPlatform
                            ? `Copie o link abaixo e cole na plataforma ${selectedPlatform.name}`
                            : <>Selecione a plataforma para integrar com <strong>{course?.name}</strong></>
                        }
                    </DialogDescription>
                </DialogHeader>

                {selectedPlatform ? (
                    <WebhookLinkView
                        platform={selectedPlatform}
                        webhookUrl={webhookUrl}
                        onBack={() => setSelectedPlatform(null)}
                    />
                ) : (
                    <WebhookPlatformList
                        platforms={platforms}
                        onSelect={setSelectedPlatform}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
