import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../SettingsSection";

export function PlatformSection() {
    const [name, setName] = useState("MembriumWL");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        // TODO: API call to save platform name
        setTimeout(() => setSaving(false), 800);
    }

    return (
        <SettingsSection
            icon="ri-layout-line"
            title="Nome da Plataforma"
            description="Este nome será exibido no cabeçalho e no título das páginas."
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="platformName">Nome da Plataforma</Label>
                    <Input
                        id="platformName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome da sua plataforma"
                    />
                    <p className="text-xs text-muted-foreground">
                        Este nome aparecerá para os alunos na área de membros.
                    </p>
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
                            "Salvar Alterações"
                        )}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
