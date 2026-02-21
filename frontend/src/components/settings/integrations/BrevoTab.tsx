import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IntegrationToggle } from "../IntegrationToggle";
import { TemplateEditor } from "./TemplateEditor";
import { integrationsService, type BrevoSettings } from "@/services/integrations";

const DEFAULT_BODY = `Olá [[name]],\n\nParabéns! Você agora tem acesso ao nosso curso.\n\nAqui estão suas credenciais de acesso:\n\nEmail: [[email]]\nSenha: [[password]]\nLink de acesso comum: [[link]]\nLink de acesso rápido: [[fast_link]]\n\nQualquer dúvida, entre em contato conosco.\n\nAtenciosamente,\nEquipe de Suporte`;

export function BrevoTab() {
    const [data, setData] = useState<BrevoSettings>({
        enabled: false,
        api_key: "",
        sender_name: "",
        sender_email: "",
        email_subject: "Bem-vindo ao seu curso [[first_name]]!",
        email_template: DEFAULT_BODY,
        template_mode: "simple",
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await integrationsService.getAll();
            if (res.brevo) {
                setData((prev) => ({
                    ...prev,
                    ...res.brevo,
                    email_template: res.brevo.email_template || prev.email_template,
                    email_subject: res.brevo.email_subject || prev.email_subject,
                }));
            }
        } catch { /* keep defaults */ }
    }

    function update(patch: Partial<BrevoSettings>) {
        setData((prev) => ({ ...prev, ...patch }));
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateBrevo(data);
            setFeedback(res.message);
        } catch {
            setFeedback("Erro ao salvar");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    return (
        <IntegrationToggle
            id="brevoToggle"
            icon="ri-mail-send-line"
            title="Brevo"
            description="Envie emails automáticos para seus alunos"
            enabled={data.enabled}
            onToggle={(v) => update({ enabled: v })}
        >
            {/* Sender info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brevoSenderName">Nome do Remetente</Label>
                    <Input
                        id="brevoSenderName"
                        value={data.sender_name}
                        onChange={(e) => update({ sender_name: e.target.value })}
                        placeholder="Nome que aparecerá como remetente"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brevoSenderEmail">Email do Remetente</Label>
                    <Input
                        id="brevoSenderEmail"
                        type="email"
                        value={data.sender_email}
                        onChange={(e) => update({ sender_email: e.target.value })}
                        placeholder="email@seudominio.com"
                    />
                </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
                <Label htmlFor="brevoApiKey">API Key</Label>
                <div className="relative">
                    <Input
                        id="brevoApiKey"
                        type={showApiKey ? "text" : "password"}
                        value={data.api_key}
                        onChange={(e) => update({ api_key: e.target.value })}
                        placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <i className={showApiKey ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">
                    <a
                        href="https://app.brevo.com/settings/keys/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Obter sua API Key na sua conta Brevo
                    </a>
                </p>
            </div>

            {/* Template editor with 70/30 preview */}
            <TemplateEditor
                format="email"
                subject={data.email_subject}
                onSubjectChange={(v) => update({ email_subject: v })}
                body={data.email_template}
                onBodyChange={(v) => update({ email_template: v })}
                templateMode={data.template_mode}
                onTemplateModeChange={(v) => update({ template_mode: v })}
            />

            <div className="flex items-center justify-end gap-3">
                {feedback && (
                    <span className="text-sm text-green-600">{feedback}</span>
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
                        "Salvar Configurações"
                    )}
                </Button>
            </div>
        </IntegrationToggle>
    );
}
