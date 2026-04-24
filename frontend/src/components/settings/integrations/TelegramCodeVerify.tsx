import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
    onVerify: (code: string, cloudPassword?: string) => void;
    onResend: () => void;
    verifying: boolean;
    resending: boolean;
    needs2FA?: boolean;
}

export function TelegramCodeVerify({ onVerify, onResend, verifying, resending, needs2FA = false }: Props) {
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Starts 60s cooldown when component mounts (code just sent)
    useEffect(() => {
        setCooldown(60);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function handleResend() {
        setCode("");
        onResend();
        // Restart cooldown after resend
        setCooldown(60);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    }

    function handleSubmit() {
        if (needs2FA) {
            onVerify(code, password || undefined);
        } else {
            onVerify(code);
        }
    }

    const canSubmit = needs2FA
        ? code.length >= 4 && password.length > 0
        : code.length >= 4;

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <i className="ri-smartphone-line text-amber-500 text-lg" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Código de Verificação
                </p>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
                Digite o código que você recebeu no <strong>Telegram</strong> (não SMS):
            </p>

            <div className="flex items-center gap-3">
                <Input
                    id="tg-verify-code"
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className="max-w-[140px] font-mono text-lg tracking-widest text-center"
                />
                {!needs2FA && (
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || verifying}
                        className="btn-brand"
                    >
                        {verifying ? (
                            <><i className="ri-loader-4-line animate-spin mr-1" />Verificando...</>
                        ) : "Verificar"}
                    </Button>
                )}
            </div>

            {/* Reenviar código */}
            <div className="flex items-center gap-2 text-xs">
                {cooldown > 0 ? (
                    <span className="text-muted-foreground">
                        <i className="ri-time-line mr-1" />
                        Reenviar em {cooldown}s
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-primary hover:underline disabled:opacity-50"
                    >
                        {resending ? (
                            <><i className="ri-loader-4-line animate-spin mr-1" />Reenviando...</>
                        ) : (
                            <><i className="ri-refresh-line mr-1" />Reenviar código</>
                        )}
                    </button>
                )}
            </div>

            {/* 2FA password step */}
            {needs2FA && (
                <div className="space-y-2 pt-1">
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <i className="ri-shield-keyhole-line text-base shrink-0 mt-0.5" />
                        <span>
                            Sua conta tem <strong>verificação em duas etapas (2FA)</strong>.
                            Informe a senha da nuvem do Telegram.
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1 max-w-xs">
                            <Input
                                id="tg-2fa-password"
                                type={showPass ? "text" : "password"}
                                placeholder="Senha da nuvem"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPass(!showPass)}
                                tabIndex={-1}
                            >
                                <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
                            </button>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit || verifying}
                            className="btn-brand shrink-0"
                        >
                            {verifying ? (
                                <><i className="ri-loader-4-line animate-spin mr-1" />Verificando...</>
                            ) : "Confirmar"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
