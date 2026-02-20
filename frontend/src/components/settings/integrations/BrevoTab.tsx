import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IntegrationToggle } from "../IntegrationToggle";
import { TemplateTagsBlock } from "./TemplateTagsBlock";
import { TemplatePreview } from "./TemplatePreview";

export function BrevoTab() {
    const [enabled, setEnabled] = useState(false);
    const [senderName, setSenderName] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [subject, setSubject] = useState("Bem-vindo ao seu curso [[first_name]]!");
    const [body, setBody] = useState(
        `Olá [[name]],\n\nParabéns! Você agora tem acesso ao nosso curso.\n\nAqui estão suas credenciais de acesso:\n\nEmail: [[email]]\nSenha: [[password]]\nLink de acesso comum: [[link]]\nLink de acesso rápido: [[fast_link]]\n\nQualquer dúvida, entre em contato conosco.\n\nAtenciosamente,\nEquipe de Suporte`
    );
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        // TODO: API call
        setTimeout(() => setSaving(false), 800);
    }

    return (
        <IntegrationToggle
            id="brevoToggle"
            icon="ri-mail-send-line"
            title="Brevo Email Marketing"
            description="Envie emails automáticos para seus alunos"
            enabled={enabled}
            onToggle={setEnabled}
        >
            {/* Sender info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brevoSenderName">Nome do Remetente</Label>
                    <Input
                        id="brevoSenderName"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Nome que aparecerá como remetente"
                    />
                    <p className="text-xs text-muted-foreground">
                        Nome que será exibido como remetente do email
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brevoSenderEmail">Email do Remetente</Label>
                    <Input
                        id="brevoSenderEmail"
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="email@seudominio.com"
                    />
                    <p className="text-xs text-muted-foreground">
                        Email que será usado como remetente
                    </p>
                </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
                <Label htmlFor="brevoApiKey">API Key</Label>
                <div className="relative">
                    <Input
                        id="brevoApiKey"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
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

            {/* Email template */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <i className="ri-mail-open-line text-primary" />
                    Template de Email
                </h4>

                <TemplateTagsBlock targetTextareaId="brevoEmailTemplate" />

                <div className="space-y-2">
                    <Label htmlFor="brevoEmailSubject">Assunto do Email</Label>
                    <Input
                        id="brevoEmailSubject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="brevoEmailTemplate">Corpo do Email</Label>
                    <Textarea
                        id="brevoEmailTemplate"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                    />
                </div>
            </div>

            <TemplatePreview text={`Assunto: ${subject}\n\n${body}`} />

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
                        "Salvar Configurações"
                    )}
                </Button>
            </div>
        </IntegrationToggle>
    );
}
