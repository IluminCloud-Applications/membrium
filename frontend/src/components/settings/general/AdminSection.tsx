import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../SettingsSection";
import { settingsService } from "@/services/settings";

export function AdminSection() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsService.getAll();
            setName(data.admin_name || "");
            setEmail(data.admin_email || "");
            setLoaded(true);
        } catch {
            setLoaded(true);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await settingsService.updateAdmin({
                name,
                email,
                current_password: currentPassword || undefined,
                new_password: newPassword || undefined,
            });
            setFeedback({ type: "success", text: res.message });
            setCurrentPassword("");
            setNewPassword("");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao salvar";
            setFeedback({ type: "error", text: msg });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 4000);
        }
    }

    if (!loaded) return null;

    return (
        <SettingsSection
            icon="ri-user-settings-line"
            title="Informações do Administrador"
            description="Gerencie seu nome, credenciais e acesso à plataforma."
        >
            <div className="space-y-4">
                {/* Name + Email side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="adminName">Nome</Label>
                        <Input
                            id="adminName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Pedro"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email</Label>
                        <Input
                            id="adminEmail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu email de acesso"
                        />
                    </div>
                </div>

                {/* Current Password + New Password side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Digite sua senha atual"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <i className={showCurrent ? "ri-eye-off-line" : "ri-eye-line"} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite uma nova senha"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <i className={showNew ? "ri-eye-off-line" : "ri-eye-line"} />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Deixe os campos de senha em branco se não deseja alterá-la.
                </p>

                <div className="flex items-center justify-end gap-3">
                    {feedback && (
                        <span className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-500"}`}>
                            {feedback.text}
                        </span>
                    )}
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
                            "Atualizar Informações"
                        )}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
