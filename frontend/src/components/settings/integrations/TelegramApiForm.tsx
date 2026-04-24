import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
    apiId: string;
    setApiId: (v: string) => void;
    apiHash: string;
    setApiHash: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
    onSendCode: () => void;
    sending: boolean;
    codeSent: boolean;
}

export function TelegramApiForm({
    apiId,
    setApiId,
    apiHash,
    setApiHash,
    phone,
    setPhone,
    onSendCode,
    sending,
    codeSent,
}: Props) {
    const [showHash, setShowHash] = useState(false);
    const canSend = apiId.trim().length > 0 && apiHash.trim().length > 5 && phone.trim().length > 6;

    return (
        <div className="space-y-4">
            {/* Badge de instrução */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                <i className="ri-information-line text-blue-500 text-lg mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Obtenha o <strong>API ID</strong> e <strong>API Hash</strong> em{" "}
                    <a
                        href="https://my.telegram.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                    >
                        my.telegram.org
                    </a>{" "}
                    → API development tools.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="tg-api-id">API ID</Label>
                    <Input
                        id="tg-api-id"
                        placeholder="12345678"
                        value={apiId}
                        onChange={(e) => setApiId(e.target.value)}
                        type="number"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="tg-api-hash">API Hash</Label>
                    <div className="relative">
                        <Input
                            id="tg-api-hash"
                            placeholder="a1b2c3d4e5..."
                            value={apiHash}
                            onChange={(e) => setApiHash(e.target.value)}
                            type={showHash ? "text" : "password"}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowHash(!showHash)}
                            tabIndex={-1}
                        >
                            <i className={showHash ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="tg-phone">Número de Telefone</Label>
                <div className="flex gap-2">
                    <Input
                        id="tg-phone"
                        placeholder="+5511999999999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        onClick={onSendCode}
                        disabled={!canSend || sending || codeSent}
                        variant="outline"
                        className="shrink-0"
                    >
                        {sending ? (
                            <><i className="ri-loader-4-line animate-spin mr-1" />Enviando...</>
                        ) : codeSent ? (
                            <><i className="ri-check-line mr-1" />Código Enviado</>
                        ) : (
                            "Enviar Código"
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Um código SMS será enviado para este número via Telegram.
                </p>
            </div>
        </div>
    );
}
