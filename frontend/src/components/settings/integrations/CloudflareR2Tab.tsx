import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationToggle } from "../IntegrationToggle";
import { integrationsService } from "@/services/integrations";

export function CloudflareR2Tab() {
    const [enabled, setEnabled] = useState(false);
    const [accountId, setAccountId] = useState("");
    const [accessKeyId, setAccessKeyId] = useState("");
    const [secretAccessKey, setSecretAccessKey] = useState("");
    const [bucket, setBucket] = useState("");
    const [customDomain, setCustomDomain] = useState("");
    const [apiToken, setApiToken] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [corsTesting, setCorsTesting] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            const r2 = res.cloudflare_r2;
            if (r2) {
                setEnabled(r2.enabled);
                setAccountId(r2.account_id || "");
                setAccessKeyId(r2.access_key_id || "");
                setSecretAccessKey(r2.secret_access_key || "");
                setBucket(r2.bucket || "");
                setApiToken(r2.api_token || "");
                // Strip protocol so state stores only the bare domain
                const raw = r2.custom_domain || "";
                setCustomDomain(raw.replace(/^https?:\/\//, ""));
            }
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    function showFeedback(message: string, type: "success" | "error", duration = 4000) {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), duration);
    }

    async function handleToggle(newValue: boolean) {
        if (newValue) {
            setEnabled(true);
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateCloudflareR2({
                enabled: false,
                account_id: accountId,
                access_key_id: accessKeyId,
                secret_access_key: secretAccessKey,
                bucket,
                custom_domain: customDomain ? `https://${customDomain}` : "",
                api_token: apiToken,
            });
            setEnabled(false);
            showFeedback(res.message, "success");
        } catch {
            showFeedback("Erro ao desabilitar Cloudflare R2", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateCloudflareR2({
                enabled,
                account_id: accountId,
                access_key_id: accessKeyId,
                secret_access_key: secretAccessKey,
                bucket,
                custom_domain: customDomain ? `https://${customDomain}` : "",
                api_token: apiToken,
            });
            showFeedback(res.message, "success", 5000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao salvar configurações do Cloudflare R2";
            showFeedback(message, "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleTest() {
        setTesting(true);
        setFeedback(null);
        try {
            const res = await integrationsService.testCloudflareR2({
                account_id: accountId,
                access_key_id: accessKeyId,
                secret_access_key: secretAccessKey,
                bucket,
            });
            showFeedback(res.message, res.success ? "success" : "error");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao testar conexão";
            showFeedback(message, "error");
        } finally {
            setTesting(false);
        }
    }

    async function handleApplyCors() {
        setCorsTesting(true);
        setFeedback(null);
        try {
            const res = await integrationsService.applyCorsCloudflareR2();
            showFeedback(res.message, res.success ? "success" : "error", 5000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao aplicar CORS";
            showFeedback(message, "error");
        } finally {
            setCorsTesting(false);
        }
    }

    const canSave =
        accountId.trim().length > 0 &&
        accessKeyId.trim().length > 0 &&
        secretAccessKey.trim().length > 0 &&
        bucket.trim().length > 0 &&
        customDomain.trim().length > 0;

    const canTest = accountId && accessKeyId && secretAccessKey && bucket;
    const isBusy = saving || testing || corsTesting;

    return (
        <IntegrationToggle
            id="cloudflareR2Toggle"
            icon="ri-cloud-line"
            title="Cloudflare R2"
            description="Hospede e sirva os vídeos das suas aulas pelo seu próprio bucket R2."
            enabled={enabled}
            onToggle={handleToggle}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="r2AccountId">Account ID</Label>
                    <Input
                        id="r2AccountId"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="Ex: 0a1b2c3d4e5f6789abcdef0123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                        Encontre no painel do Cloudflare em <strong>R2 → Manage R2 API Tokens</strong>.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="r2AccessKeyId">Access Key ID</Label>
                    <Input
                        id="r2AccessKeyId"
                        value={accessKeyId}
                        onChange={(e) => setAccessKeyId(e.target.value)}
                        placeholder="Sua R2 Access Key ID"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="r2SecretAccessKey">Secret Access Key</Label>
                    <div className="relative">
                        <Input
                            id="r2SecretAccessKey"
                            type={showSecret ? "text" : "password"}
                            value={secretAccessKey}
                            onChange={(e) => setSecretAccessKey(e.target.value)}
                            placeholder="Sua R2 Secret Access Key"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showSecret ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="r2Bucket">Nome do Bucket</Label>
                    <Input
                        id="r2Bucket"
                        value={bucket}
                        onChange={(e) => setBucket(e.target.value)}
                        placeholder="Ex: meus-videos"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="r2CustomDomain">Custom Domain (URL pública)</Label>
                    <div className="flex rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                        <span className="flex items-center select-none bg-muted px-3 text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                            https://
                        </span>
                        <input
                            id="r2CustomDomain"
                            type="text"
                            value={customDomain}
                            onChange={(e) => {
                                // Prevent the user from typing the protocol manually
                                const val = e.target.value.replace(/^https?:\/\//, "");
                                setCustomDomain(val);
                            }}
                            placeholder="videos.seu-dominio.com"
                            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Conecte seu domínio ao bucket em <strong>R2 → Settings → Public access</strong>.
                        Esta URL é o que o player do aluno vai carregar.
                    </p>
                </div>

                {/* API Token (for CORS auto-config) */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="r2ApiToken">
                        API Token{" "}
                        <span className="text-muted-foreground font-normal text-xs">(opcional — para configurar CORS automaticamente)</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="r2ApiToken"
                            type={showToken ? "text" : "password"}
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            placeholder="Cloudflare API Token com permissão R2:Edit"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showToken ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Crie em <strong>Cloudflare → Meu Perfil → API Tokens</strong> com permissão{" "}
                        <strong>R2:Edit</strong>. Sem ele, configure o CORS manualmente no dashboard do R2{" "}
                        (bucket → Settings → CORS). O CORS é necessário para o upload direto do browser funcionar.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {feedback && (
                    <span
                        className={`text-sm animate-fade-in mr-auto ${feedback.type === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}
                    >
                        {feedback.message}
                    </span>
                )}

                {/* Test connection */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={isBusy || !canTest}
                >
                    {testing ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2" />
                            Testando...
                        </>
                    ) : (
                        <>
                            <i className="ri-plug-line mr-2" />
                            Testar Conexão
                        </>
                    )}
                </Button>

                {/* Apply CORS — shown when already saved (enabled + bucket filled) */}
                {enabled && bucket && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCors}
                        disabled={isBusy}
                        title="Aplica a política de CORS no bucket para permitir uploads diretos do navegador"
                    >
                        {corsTesting ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2" />
                                Aplicando CORS...
                            </>
                        ) : (
                            <>
                                <i className="ri-shield-check-line mr-2" />
                                Aplicar CORS
                            </>
                        )}
                    </Button>
                )}

                {/* Save */}
                <Button
                    onClick={handleSave}
                    disabled={isBusy || !canSave}
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
