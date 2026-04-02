import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { integrationsService, type ChatwootSettings } from "@/services/integrations";

const DEFAULT: ChatwootSettings = {
    enabled: false,
    base_url: "",
    account_id: "",
    inbox_id: "",
    api_key: "",
    embed_enabled: false,
    embed_script: "",
};

export function ChatwootTab() {
    const [settings, setSettings] = useState<ChatwootSettings>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await integrationsService.getAll();
            setSettings({ ...DEFAULT, ...data.chatwoot });
        } catch {
            toast.error("Erro ao carregar configurações do Chatwoot");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Embed mode validation
        if (settings.embed_enabled && !settings.embed_script.trim()) {
            toast.error("Cole o código embed do Chatwoot para ativar o modo embed");
            return;
        }

        // Sync mode validation
        if (settings.enabled && (!settings.base_url || !settings.account_id || !settings.inbox_id || !settings.api_key)) {
            toast.error("Preencha todos os campos obrigatórios para ativar a sincronização");
            return;
        }

        // Both modes cannot be active simultaneously
        if (settings.enabled && settings.embed_enabled) {
            toast.error("Desative a Sincronização com IA antes de ativar o Embed próprio, ou vice-versa.");
            return;
        }

        setSaving(true);
        try {
            await integrationsService.updateChatwoot(settings);
            toast.success("Configurações do Chatwoot atualizadas");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao salvar configurações");
        } finally {
            setSaving(false);
        }
    };

    const set = (patch: Partial<ChatwootSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

    if (loading) return null;

    return (
        <div className="space-y-4 animate-fade-in">

            {/* ── Sync Mode (AI Integration) ─────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <i className="ri-chat-smile-2-line text-xl" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Sincronização com IA</CardTitle>
                                <CardDescription className="text-sm">
                                    Espelha as conversas do chatbot interno da Membrium no painel do Chatwoot.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="chatwoot-enabled" className="text-sm cursor-pointer select-none">
                                {settings.enabled ? "Ativo" : "Inativo"}
                            </Label>
                            <Switch
                                id="chatwoot-enabled"
                                checked={settings.enabled}
                                onCheckedChange={(checked) =>
                                    set({ enabled: checked, ...(checked ? { embed_enabled: false } : {}) })
                                }
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {settings.embed_enabled && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                            <i className="ri-alert-line text-amber-500 text-base mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                O <strong>Embed Próprio</strong> está ativo. Desative-o primeiro para usar a
                                Sincronização com IA.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>URL do Chatwoot <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ex: https://app.chatwoot.com ou https://chatwoot.meudominio.com"
                                value={settings.base_url}
                                onChange={(e) => set({ base_url: e.target.value })}
                                disabled={!settings.enabled}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                URL base da sua instância. Use <code>https://app.chatwoot.com</code> se for a versão cloud.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Account ID <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ex: 1"
                                value={settings.account_id}
                                onChange={(e) => set({ account_id: e.target.value })}
                                disabled={!settings.enabled}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                ID da conta visível na URL (ex: app.chatwoot.com/app/accounts/<strong>ID</strong>)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Inbox ID <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ex: 1"
                                value={settings.inbox_id}
                                onChange={(e) => set({ inbox_id: e.target.value })}
                                disabled={!settings.enabled}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Acesse: Configurações → Caixas de Entrada → Clicar na engrenagem.
                            </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>API Access Token <span className="text-destructive">*</span></Label>
                            <Input
                                type="password"
                                placeholder="Token de acesso do perfil de usuário"
                                value={settings.api_key}
                                onChange={(e) => set({ api_key: e.target.value })}
                                disabled={!settings.enabled}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Configure em: Chatwoot → Configurações de Perfil (Avatar no canto inferior esquerdo) → Access Token.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* ── Embed Mode ───────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                <i className="ri-code-box-line text-xl" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Embed Próprio (Widget do Cliente)</CardTitle>
                                <CardDescription className="text-sm">
                                    Use seu próprio widget do Chatwoot. A IA interna será desativada automaticamente.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="embed-enabled" className="text-sm cursor-pointer select-none">
                                {settings.embed_enabled ? "Ativo" : "Inativo"}
                            </Label>
                            <Switch
                                id="embed-enabled"
                                checked={settings.embed_enabled}
                                onCheckedChange={(checked) =>
                                    set({ embed_enabled: checked, ...(checked ? { enabled: false } : {}) })
                                }
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                        <i className="ri-information-line text-blue-500 text-base mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Cole abaixo o código{" "}
                            <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">&lt;script&gt;</code>{" "}
                            gerado pelo Chatwoot (Configurações → Caixas de Entrada → Código de Instalação).
                            Ele será injetado automaticamente na área de membros.{" "}
                            <strong>Quando ativo, o chatbot interno da Membrium fica desabilitado.</strong>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Código Embed do Chatwoot{" "}
                            {settings.embed_enabled && <span className="text-destructive">*</span>}
                        </Label>
                        <Textarea
                            placeholder={`<script>\n  (function(d,t) {\n    var BASE_URL="https://chatwoot.exemplo.com";\n    ...\n  })(document,"script");\n</script>`}
                            value={settings.embed_script}
                            onChange={(e) => set({ embed_script: e.target.value })}
                            disabled={!settings.embed_enabled}
                            rows={8}
                            className="font-mono text-xs resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Aceita o código completo gerado pelo Chatwoot, incluindo as tags{" "}
                            <code className="font-mono">&lt;script&gt;...&lt;/script&gt;</code>.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2" />
                            Salvando...
                        </>
                    ) : (
                        "Salvar Configurações"
                    )}
                </Button>
            </div>
        </div>
    );
}
