import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { TelegramApiForm } from "./TelegramApiForm";
import { TelegramCodeVerify } from "./TelegramCodeVerify";
import { TelegramConnectionStatus } from "./TelegramConnectionStatus";
import { telegramService } from "@/services/telegramService";
import { integrationsService } from "@/services/integrations";

export function TelegramTab() {
    const [enabled, setEnabled] = useState(false);
    const [connected, setConnected] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const [apiId, setApiId] = useState("");
    const [apiHash, setApiHash] = useState("");
    const [phone, setPhone] = useState("");
    const [canalId, setCanalId] = useState("");
    const [canalNome, setCanalNome] = useState("");

    const [sending, setSending] = useState(false);
    const [resending, setResending] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [needs2FA, setNeeds2FA] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [creatingChannel, setCreatingChannel] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showFeedback = (message: string, type: "success" | "error" = "success", ms = 5000) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), ms);
    };

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            if (res.telegram) {
                setEnabled(res.telegram.enabled);
                setConnected(res.telegram.connected);
                setApiId(res.telegram.api_id || "");
                setPhone(res.telegram.phone || "");
                setCanalId(res.telegram.canal_id || "");
                setCanalNome(res.telegram.canal_nome || "");
                setSessionError((res.telegram as any).session_error || "");
            }
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleToggle(value: boolean) {
        setEnabled(value);
        if (!value && connected) {
            await handleDisconnect();
        }
    }

    async function handleSendCode() {
        setSending(true);
        setCodeSent(false);
        setNeeds2FA(false);
        try {
            const res = await telegramService.sendCode(apiId, apiHash, phone);
            if (res.success) {
                setCodeSent(true);
                showFeedback(res.message);
            } else {
                showFeedback(res.message, "error");
            }
        } catch {
            showFeedback("Erro ao enviar código.", "error");
        } finally {
            setSending(false);
        }
    }

    async function handleResendCode() {
        setResending(true);
        try {
            const res = await telegramService.sendCode(apiId, apiHash, phone);
            if (res.success) {
                showFeedback("Código reenviado!");
            } else {
                showFeedback(res.message, "error");
            }
        } catch {
            showFeedback("Erro ao reenviar código.", "error");
        } finally {
            setResending(false);
        }
    }

    async function handleVerifyCode(code: string, cloudPassword?: string) {
        setVerifying(true);
        try {
            const res = await telegramService.verifyCode(code, cloudPassword);

            if ((res as any).needs_2fa) {
                // Telegram pediu senha de 2FA — mostra segundo input
                setNeeds2FA(true);
                showFeedback((res as any).message, "error");
                return;
            }

            if (res.success) {
                setConnected(true);
                setCodeSent(false);
                setNeeds2FA(false);
                setSessionError("");
                showFeedback(res.message);
                await loadData();
            } else {
                showFeedback(res.message, "error");
            }
        } catch {
            showFeedback("Erro ao verificar código.", "error");
        } finally {
            setVerifying(false);
        }
    }

    async function handleCreateChannel() {
        setCreatingChannel(true);
        try {
            const res = await telegramService.createChannel();
            if (res.success) {
                setCanalId(String(res.canal_id || ""));
                setCanalNome(res.canal_nome || "");
                showFeedback(res.message);
            } else {
                showFeedback(res.message, "error");
            }
        } catch {
            showFeedback("Erro ao criar canal.", "error");
        } finally {
            setCreatingChannel(false);
        }
    }

    async function handleDisconnect() {
        try {
            const res = await telegramService.disconnect();
            if (res.success) {
                setConnected(false);
                setCodeSent(false);
                setNeeds2FA(false);
                setSessionError("");
                setCanalId("");
                setCanalNome("");
                showFeedback(res.message);
            }
        } catch {
            showFeedback("Erro ao desconectar.", "error");
        }
    }

    return (
        <IntegrationToggle
            id="telegramToggle"
            icon="ri-telegram-line"
            title="Telegram"
            description="Upload ilimitado de vídeos via canal privado do Telegram"
            enabled={enabled}
            onToggle={handleToggle}
        >
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <i className="ri-information-line text-blue-500" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    O Telegram usa MTProto via conta pessoal — sem limite de tamanho de arquivo.
                    Os vídeos ficam em um canal privado e são transmitidos ao aluno por chunks.
                </AlertDescription>
            </Alert>

            {/* Formulário de credenciais (sempre visível quando não conectado) */}
            {!connected && (
                <TelegramApiForm
                    apiId={apiId}
                    setApiId={setApiId}
                    apiHash={apiHash}
                    setApiHash={setApiHash}
                    phone={phone}
                    setPhone={setPhone}
                    onSendCode={handleSendCode}
                    sending={sending}
                    codeSent={codeSent}
                />
            )}

            {/* Verificação de código (+ 2FA se necessário) */}
            {codeSent && !connected && (
                <TelegramCodeVerify
                    onVerify={handleVerifyCode}
                    onResend={handleResendCode}
                    verifying={verifying}
                    resending={resending}
                    needs2FA={needs2FA}
                />
            )}

            {/* Status da conexão / canal / sessão expirada */}
            <TelegramConnectionStatus
                connected={connected}
                sessionError={sessionError}
                canalNome={canalNome}
                canalId={canalId}
                phone={phone}
                onDisconnect={handleDisconnect}
                onCreateChannel={handleCreateChannel}
                creatingChannel={creatingChannel}
            />

            {/* Feedback */}
            {feedback && (
                <div
                    className={`flex items-center gap-2 text-sm animate-fade-in px-1 ${
                        feedback.type === "error"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                    }`}
                >
                    <i className={feedback.type === "error" ? "ri-error-warning-line" : "ri-check-line"} />
                    {feedback.message}
                </div>
            )}
        </IntegrationToggle>
    );
}
