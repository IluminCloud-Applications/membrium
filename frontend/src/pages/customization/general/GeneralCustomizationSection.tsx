import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings";
import { customizationService, DEFAULT_LOGIN_CONFIG } from "@/services/customization";
import type { LoginPageConfig } from "@/services/customization";
import { ImageUploadField } from "../login/ImageUploadField";

export function GeneralCustomizationSection() {
    const [config, setConfig] = useState<LoginPageConfig>(DEFAULT_LOGIN_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        setLoading(true);
        try {
            const res = await customizationService.getLoginConfig();
            setConfig(res);
        } catch {
            toast.error("Erro ao carregar configurações gerais.");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(field: keyof LoginPageConfig, value: any) {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);

        try {
            await customizationService.updateLoginConfig({ [field]: value });
            toast.success("Configuração atualizada!");
        } catch {
            toast.error("Erro ao salvar configuração.");
        }
    }

    if (loading) return null;

    return (
        <SettingsSection
            icon="ri-global-line"
            title="Configurações Gerais da Plataforma"
        >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-4 p-4 border border-border rounded-xl bg-card">
                        <h3 className="font-medium flex items-center gap-2">
                            <i className="ri-image-line text-primary" />
                            Favicon & OG Image
                        </h3>
                        <div className="pt-2">
                            <ImageUploadField
                                label="Imagem do Favicon"
                                hint="Envie uma imagem quadrada (1:1), recomendação: 512x512px. Essa imagem será usada na aba do navegador e ao compartilhar os links da plataforma."
                                currentFile={config.favicon}
                                onUploaded={(file) => handleUpdate("favicon", file)}
                                onRemoved={() => handleUpdate("favicon", null)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
}
