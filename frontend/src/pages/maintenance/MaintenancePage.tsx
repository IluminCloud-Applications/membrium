import { useEffect, useState, useCallback, useRef } from "react";
import "remixicon/fonts/remixicon.css";
import "./maintenance.css";

interface MaintenancePageProps {
    onReconnected: () => void;
    checkConnection: () => Promise<boolean>;
}

const RETRY_INTERVAL = 10_000; // 10 seconds

export function MaintenancePage({ onReconnected, checkConnection }: MaintenancePageProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [countdown, setCountdown] = useState(RETRY_INTERVAL / 1000);
    const [attempts, setAttempts] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const tryReconnect = useCallback(async () => {
        setIsRetrying(true);
        setAttempts((prev) => prev + 1);

        try {
            const isOnline = await checkConnection();
            if (isOnline) {
                onReconnected();
                return;
            }
        } catch {
            // Still offline
        }

        setIsRetrying(false);
        setCountdown(RETRY_INTERVAL / 1000);
    }, [checkConnection, onReconnected]);

    // Auto-retry countdown
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    tryReconnect();
                    return RETRY_INTERVAL / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [tryReconnect]);

    return (
        <div className="maintenance-container">
            <div className="maintenance-card">
                {/* Animated icon */}
                <div className="maintenance-icon-wrapper">
                    <div className="maintenance-icon-pulse" />
                    <div className="maintenance-icon">
                        <i className="ri-tools-fill" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="maintenance-title">
                    Em manutenção
                </h1>

                {/* Description */}
                <p className="maintenance-description">
                    Estamos realizando uma atualização no sistema.
                    <br />
                    Por favor, aguarde alguns instantes ou volte em breve.
                </p>

                {/* Status */}
                <div className="maintenance-status">
                    <div className={`maintenance-status-dot ${isRetrying ? "retrying" : ""}`} />
                    <span className="maintenance-status-text">
                        {isRetrying
                            ? "Verificando conexão..."
                            : `Tentando novamente em ${countdown}s`
                        }
                    </span>
                </div>

                {/* Manual retry button */}
                <button
                    className="maintenance-retry-btn"
                    onClick={tryReconnect}
                    disabled={isRetrying}
                >
                    {isRetrying ? (
                        <>
                            <i className="ri-loader-4-line maintenance-spin" />
                            Conectando...
                        </>
                    ) : (
                        <>
                            <i className="ri-refresh-line" />
                            Tentar agora
                        </>
                    )}
                </button>

                {/* Attempts counter */}
                {attempts > 0 && (
                    <p className="maintenance-attempts">
                        {attempts} tentativa{attempts > 1 ? "s" : ""} realizada{attempts > 1 ? "s" : ""}
                    </p>
                )}
            </div>
        </div>
    );
}
