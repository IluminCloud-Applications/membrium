import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { developerApiService } from "@/services/developerApi";

interface ApiEndpointDoc {
    id: string;
    title: string;
    method: "GET" | "POST";
    path: string;
    description: string;
    paramsDesc: string;
    getCurl: (baseUrl: string, apiKey: string) => string;
    sampleResponse: string;
}

export function DeveloperApiTab() {
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedCurlId, setCopiedCurlId] = useState<string | null>(null);
    const [copiedJsonId, setCopiedJsonId] = useState<string | null>(null);

    // Modais de confirmação
    const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await developerApiService.get();
            setHasKey(res.has_key);
            setApiKey(res.api_key || "");
            setBaseUrl(res.base_url || window.location.origin);
        } catch (error) {
            console.error("Erro ao carregar dados da API:", error);
            toast.error("Erro ao carregar chave de API");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleGenerateKey() {
        setGenerating(true);
        try {
            const res = await developerApiService.generate();
            setHasKey(true);
            setApiKey(res.api_key);
            setBaseUrl(res.base_url || window.location.origin);
            setShowKey(true);
            toast.success(res.message || "Chave gerada com sucesso!");
        } catch {
            toast.error("Erro ao gerar chave de API");
        } finally {
            setGenerating(false);
            setConfirmRegenerateOpen(false);
        }
    }

    async function handleRevokeKey() {
        setGenerating(true);
        try {
            await developerApiService.revoke();
            setHasKey(false);
            setApiKey("");
            setShowKey(false);
            toast.success("Chave revogada!");
        } catch {
            toast.error("Erro ao revogar chave");
        } finally {
            setGenerating(false);
            setConfirmRevokeOpen(false);
        }
    }

    function handleCopyKey() {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setCopiedKey(true);
        toast.success("Chave de API copiada!");
        setTimeout(() => setCopiedKey(false), 2000);
    }

    function handleCopyCurl(curlCmd: string, id: string) {
        navigator.clipboard.writeText(curlCmd);
        setCopiedCurlId(id);
        toast.success("cURL copiado!");
        setTimeout(() => setCopiedCurlId(null), 2000);
    }

    function handleCopyJson(jsonStr: string, id: string) {
        navigator.clipboard.writeText(jsonStr);
        setCopiedJsonId(id);
        toast.success("JSON copiado!");
        setTimeout(() => setCopiedJsonId(null), 2000);
    }

    const displayBaseUrl = baseUrl || window.location.origin;
    const activeKey = hasKey && apiKey ? apiKey : "SUA_CHAVE_API_AQUI";

    const endpoints: ApiEndpointDoc[] = [
        {
            id: "search",
            title: "Encontrar Alunos",
            method: "GET",
            path: "/api/v1/students/search",
            description: "Busca alunos por e-mail, telefone ou nome. Retorno resumido para bots.",
            paramsDesc: "Parâmetros: ?q=11999999999 ou ?email=aluno@email.com ou ?phone=11999999999",
            getCurl: (bUrl, key) =>
                `curl -X GET "${bUrl}/api/v1/students/search?q=aluno@email.com" \\\n  -H "X-API-Key: ${key}"`,
            sampleResponse: JSON.stringify(
                {
                    success: true,
                    total: 1,
                    students: [
                        {
                            id: 42,
                            uuid: "3f82a170-4f51-4c6b-bfca-112233445566",
                            name: "João da Silva",
                            email: "aluno@email.com",
                            phone: "11999999999",
                            status: "active",
                            courses_count: 2,
                            courses: [
                                { id: 1, name: "Curso Principal" },
                                { id: 3, name: "Bônus VIP" }
                            ],
                            quick_access_url: `${displayBaseUrl}/access/3f82a170-4f51-4c6b-bfca-112233445566`,
                            last_access_at: "2026-10-08T17:45:00",
                            created_at: "2026-06-15T11:20:00"
                        }
                    ]
                },
                null,
                2
            ),
        },
        {
            id: "quick-access",
            title: "Gerar Acesso Único (Link Direto)",
            method: "POST",
            path: "/api/v1/students/{identificador}/quick-access",
            description: "Gera o link de login instantâneo sem senha (UUID) para enviar no chat.",
            paramsDesc: "Parâmetro: {identificador} aceita ID, UUID ou E-mail.",
            getCurl: (bUrl, key) =>
                `curl -X POST "${bUrl}/api/v1/students/aluno@email.com/quick-access" \\\n  -H "X-API-Key: ${key}"`,
            sampleResponse: JSON.stringify(
                {
                    success: true,
                    student: {
                        id: 42,
                        uuid: "3f82a170-4f51-4c6b-bfca-112233445566",
                        name: "João da Silva",
                        email: "aluno@email.com",
                        phone: "11999999999"
                    },
                    quick_access_token: "3f82a170-4f51-4c6b-bfca-112233445566",
                    quick_access_url: `${displayBaseUrl}/access/3f82a170-4f51-4c6b-bfca-112233445566`,
                    direct_url: `${displayBaseUrl}/quick-access/3f82a170-4f51-4c6b-bfca-112233445566`,
                    login_url: `${displayBaseUrl}/login`
                },
                null,
                2
            ),
        },
        {
            id: "details",
            title: "Obter Dados Completos do Aluno",
            method: "GET",
            path: "/api/v1/students/{identificador}",
            description: "Retorna ficha cadastral, cursos matriculados, percentual de conclusão e atividades.",
            paramsDesc: "Parâmetro: {identificador} aceita ID, UUID ou E-mail.",
            getCurl: (bUrl, key) =>
                `curl -X GET "${bUrl}/api/v1/students/aluno@email.com" \\\n  -H "X-API-Key: ${key}"`,
            sampleResponse: JSON.stringify(
                {
                    success: true,
                    student: {
                        id: 42,
                        uuid: "3f82a170-4f51-4c6b-bfca-112233445566",
                        name: "João da Silva",
                        email: "aluno@email.com",
                        phone: "11999999999",
                        status: "active",
                        created_at: "2026-06-15T11:20:00",
                        last_access_at: "2026-10-08T17:45:00",
                        quick_access_url: `${displayBaseUrl}/access/3f82a170-4f51-4c6b-bfca-112233445566`,
                        progress_summary: {
                            total_lessons: 30,
                            completed_lessons: 15,
                            overall_percentage: 50.0
                        },
                        courses: [
                            {
                                id: 1,
                                uuid: "8c91a...",
                                name: "Curso Principal",
                                category: "principal",
                                is_published: true,
                                modules_count: 4,
                                total_lessons: 20,
                                completed_lessons: 15,
                                progress_percentage: 75.0
                            }
                        ],
                        recent_activities: [
                            {
                                action: "complete_lesson",
                                description: "Concluiu a aula 'Como fechar vendas'",
                                created_at: "2026-10-08T17:40:00"
                            }
                        ]
                    }
                },
                null,
                2
            ),
        },
        {
            id: "reset-password",
            title: "Redefinir Senha & Enviar E-mail",
            method: "POST",
            path: "/api/v1/students/{identificador}/reset-password",
            description: "Gera nova senha segura e envia credenciais por e-mail (Brevo/WhatsApp).",
            paramsDesc: "Parâmetro: {identificador} aceita ID, UUID ou E-mail.",
            getCurl: (bUrl, key) =>
                `curl -X POST "${bUrl}/api/v1/students/aluno@email.com/reset-password" \\\n  -H "X-API-Key: ${key}" \\\n  -H "Content-Type: application/json"`,
            sampleResponse: JSON.stringify(
                {
                    success: true,
                    message: "Senha redefinida com sucesso e credenciais enviadas por e-mail.",
                    student: {
                        id: 42,
                        uuid: "3f82a170-4f51-4c6b-bfca-112233445566",
                        name: "João da Silva",
                        email: "aluno@email.com",
                        phone: "11999999999"
                    },
                    temporary_password: "k9Lm3nP8",
                    quick_access_url: `${displayBaseUrl}/access/3f82a170-4f51-4c6b-bfca-112233445566`,
                    notifications: {
                        email_sent: true,
                        whatsapp_sent: false
                    }
                },
                null,
                2
            ),
        },
    ];

    function handleCopyAllForAI() {
        const doc = [
            `# Membrium - Documentação das APIs de Alunos`,
            `Base URL: ${displayBaseUrl}`,
            `Autenticação: Header "X-API-Key: ${activeKey}" ou "Authorization: Bearer ${activeKey}"`,
            ``,
            ...endpoints.map((ep, idx) => {
                const curlCmd = ep.getCurl(displayBaseUrl, activeKey);
                return [
                    `---`,
                    `### ${idx + 1}. ${ep.title}`,
                    `- Método: ${ep.method}`,
                    `- Rota: ${ep.path}`,
                    `- Descrição: ${ep.description}`,
                    `- ${ep.paramsDesc}`,
                    ``,
                    `#### cURL:`,
                    `\`\`\`bash`,
                    curlCmd,
                    `\`\`\``,
                    ``,
                    `#### Resposta JSON:`,
                    `\`\`\`json`,
                    ep.sampleResponse,
                    `\`\`\``,
                    ``,
                ].join("\n");
            }),
        ].join("\n");

        navigator.clipboard.writeText(doc);
        setCopiedAll(true);
        toast.success("Tudo copiado! Cole direto no ChatGPT, Claude ou bot.");
        setTimeout(() => setCopiedAll(false), 2500);
    }

    return (
        <div className="space-y-4">
            {/* Bloco de Gerenciamento da Chave de API */}
            <div className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <i className="ri-key-2-line text-primary" />
                        <span className="font-semibold text-sm">Chave de API</span>
                        <Badge variant="outline" className="text-[11px] font-normal px-2 py-0">
                            v1
                        </Badge>
                    </div>

                    {!hasKey ? (
                        <Button
                            size="sm"
                            onClick={handleGenerateKey}
                            disabled={loading || generating}
                            className="gap-1.5 h-8 text-xs shrink-0"
                        >
                            <i className="ri-magic-line" />
                            {generating ? "Gerando..." : "Gerar Chave de API"}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmRegenerateOpen(true)}
                                disabled={generating}
                                className="gap-1.5 text-xs h-8"
                            >
                                <i className="ri-refresh-line" />
                                Regerar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmRevokeOpen(true)}
                                disabled={generating}
                                className="gap-1 text-xs h-8 text-destructive hover:bg-destructive/10"
                            >
                                <i className="ri-delete-bin-line" />
                                Revogar
                            </Button>
                        </div>
                    )}
                </div>

                {hasKey ? (
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Input
                                    readOnly
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    className="font-mono text-xs pr-9 bg-muted/40 h-8 rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                    title={showKey ? "Ocultar" : "Mostrar"}
                                >
                                    <i className={showKey ? "ri-eye-off-line" : "ri-eye-line"} />
                                </button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyKey}
                                className="shrink-0 gap-1 text-xs h-8 rounded-md"
                            >
                                <i className={copiedKey ? "ri-check-line text-emerald-500" : "ri-file-copy-line"} />
                                {copiedKey ? "Copiada!" : "Copiar"}
                            </Button>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            Envie via cabeçalho:{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
                                X-API-Key: {apiKey.slice(0, 10)}...
                            </code>
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Gere sua chave para liberar o acesso externo e preencher automaticamente os cURLs abaixo.
                    </p>
                )}
            </div>

            {/* Ações e Accordion de APIs */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">Endpoints Disponíveis</span>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyAllForAI}
                        className="gap-1.5 h-8 text-xs font-medium"
                    >
                        <i className={copiedAll ? "ri-check-line text-emerald-500" : "ri-file-copy-2-line"} />
                        {copiedAll ? "Tudo Copiado!" : "Copiar Tudo (IA / ChatGPT)"}
                    </Button>
                </div>

                <Accordion type="multiple" defaultValue={["search"]} className="space-y-2">
                    {endpoints.map((ep) => {
                        const curlString = ep.getCurl(displayBaseUrl, activeKey);
                        const isCurlCopied = copiedCurlId === ep.id;
                        const isJsonCopied = copiedJsonId === ep.id;

                        return (
                            <AccordionItem
                                key={ep.id}
                                value={ep.id}
                                className="border rounded-lg bg-card px-3.5 py-1"
                            >
                                <AccordionTrigger className="hover:no-underline py-2.5 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            className={
                                                ep.method === "GET"
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 font-bold"
                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 font-bold"
                                            }
                                        >
                                            {ep.method}
                                        </Badge>
                                        <span className="font-mono text-xs font-medium text-foreground">
                                            {ep.path}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-normal">
                                            — {ep.title}
                                        </span>
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="space-y-3 pt-1 pb-3 text-xs">
                                    <div className="space-y-0.5 text-muted-foreground">
                                        <p className="text-foreground font-medium">{ep.description}</p>
                                        <p className="text-[11px] font-mono text-muted-foreground">{ep.paramsDesc}</p>
                                    </div>

                                    {/* Campo cURL com visual limpo e sem corte */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-muted-foreground">cURL:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyCurl(curlString, ep.id)}
                                                className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <i className={isCurlCopied ? "ri-check-line text-emerald-500" : "ri-file-copy-line"} />
                                                {isCurlCopied ? "Copiado" : "Copiar cURL"}
                                            </Button>
                                        </div>
                                        <pre className="p-3 rounded-md bg-muted/60 border text-[11px] font-mono overflow-x-auto text-foreground whitespace-pre leading-relaxed select-all">
                                            {curlString}
                                        </pre>
                                    </div>

                                    {/* Resposta JSON */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-muted-foreground">Resposta JSON:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyJson(ep.sampleResponse, ep.id)}
                                                className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <i className={isJsonCopied ? "ri-check-line text-emerald-500" : "ri-file-copy-line"} />
                                                {isJsonCopied ? "Copiado" : "Copiar JSON"}
                                            </Button>
                                        </div>
                                        <pre className="p-3 rounded-md bg-muted/30 border text-[11px] font-mono overflow-x-auto text-foreground/90 whitespace-pre leading-relaxed select-all max-h-52">
                                            {ep.sampleResponse}
                                        </pre>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>

            {/* Modal: Regerar Chave */}
            <AlertDialog open={confirmRegenerateOpen} onOpenChange={setConfirmRegenerateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regerar Chave de API?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A chave anterior será invalidada imediatamente. Qualquer bot ou automação usando a chave antiga precisará ser atualizado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={generating}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGenerateKey} disabled={generating}>
                            {generating ? "Regerando..." : "Regerar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal: Revogar Chave */}
            <AlertDialog open={confirmRevokeOpen} onOpenChange={setConfirmRevokeOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Revogar Chave de API?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Todas as chamadas à API com esta chave passarão a retornar 401 Unauthorized.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={generating}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevokeKey}
                            disabled={generating}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {generating ? "Revogando..." : "Revogar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
