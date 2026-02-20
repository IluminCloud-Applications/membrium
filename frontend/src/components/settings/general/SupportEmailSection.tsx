import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../SettingsSection";

export function SupportEmailSection() {
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        // TODO: API call to save support info
        setTimeout(() => setSaving(false), 800);
    }

    return (
        <SettingsSection
            icon="ri-customer-service-2-line"
            title="Suporte"
            description="Canais de suporte exibidos para os alunos na plataforma."
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="supportEmail">Email de Suporte</Label>
                        <Input
                            id="supportEmail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="suporte@seudominio.com"
                        />
                        <p className="text-xs text-muted-foreground">
                            Os alunos verão este email na página de suporte.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="supportWhatsapp">WhatsApp de Suporte</Label>
                        <div className="relative">
                            <i className="ri-whatsapp-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="supportWhatsapp"
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="5511999999999"
                                className="pl-9"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Número com código do país, sem espaços ou traços.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-brand"
                    >
                        {saving ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar Suporte"
                        )}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
