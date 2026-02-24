import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthLayoutModern } from "@/components/auth/AuthLayoutModern";
import { LoginForm } from "./LoginForm";
import { ForgotPasswordModal } from "@/components/modals/auth/ForgotPasswordModal";
import {
    customizationService,
    DEFAULT_LOGIN_CONFIG,
    DEFAULT_DEVICE_CONFIG,
    type LoginPageConfig,
    type DeviceConfig,
} from "@/services/customization";

interface LoginPageProps {
    platformName: string;
}

export function LoginPage({ platformName }: LoginPageProps) {
    const [forgotOpen, setForgotOpen] = useState(false);
    const [config, setConfig] = useState<LoginPageConfig>(DEFAULT_LOGIN_CONFIG);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        loadCustomization();
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    async function loadCustomization() {
        try {
            const data = await customizationService.getLoginConfig();
            setConfig({ ...DEFAULT_LOGIN_CONFIG, ...data });
        } catch { /* keep defaults */ }
    }

    // Pick the device-specific config
    const dc: DeviceConfig = {
        ...DEFAULT_DEVICE_CONFIG,
        ...(isMobile ? config.mobile : config.desktop),
    };

    const subtitle = config.subtitle || "Faça login para acessar sua área de membros";
    const logoUrl = config.logo ? `/static/uploads/${config.logo}` : null;
    const customStyles = buildCustomStyles(dc, config.custom_css);

    // ─── Modern layout ──────────────────────────────────────

    if (config.layout === "modern") {
        return (
            <>
                {customStyles && <style>{customStyles}</style>}
                <AuthLayoutModern
                    backgroundImage={dc.background_image}
                    backgroundColor={dc.background_color}
                    overlayOpacity={dc.overlay_opacity}
                    logoUrl={config.logo}
                    platformName={platformName}
                    customCss={config.custom_css}
                >
                    <div className="text-center mb-6 lg:text-left">
                        <h1 className="platform-name text-3xl lg:text-4xl">Bem-vindo</h1>
                        <p className="login-subtitle text-sm mt-1">{subtitle}</p>
                    </div>
                    <LoginForm onForgotPassword={() => setForgotOpen(true)} />
                    <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
                </AuthLayoutModern>
            </>
        );
    }

    // ─── Simple layout ──────────────────────────────────────

    return (
        <>
            {customStyles && <style>{customStyles}</style>}
            <AuthLayout
                backgroundImage={dc.background_image}
                backgroundColor={dc.background_color}
                overlayOpacity={dc.overlay_opacity}
                customCss={config.custom_css}
            >
                <div className="text-center mb-6">
                    {logoUrl ? (
                        <img src={logoUrl} alt={platformName} className="h-14 mx-auto mb-3 object-contain" />
                    ) : (
                        <h1 className="platform-name">{platformName}</h1>
                    )}
                    <p className="login-subtitle text-sm mt-1">{subtitle}</p>
                </div>
                <Card className="login-card border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <CardContent className="p-8">
                        <LoginForm onForgotPassword={() => setForgotOpen(true)} />
                    </CardContent>
                </Card>
                <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
            </AuthLayout>
        </>
    );
}

/** Build CSS overrides from device-specific config */
function buildCustomStyles(dc: DeviceConfig, customCss: string | null): string | null {
    const rules: string[] = [];

    if (dc.card_color) {
        rules.push(`.login-card { background-color: ${dc.card_color} !important; }`);
    }
    if (dc.text_color) {
        rules.push(`.login-subtitle { color: ${dc.text_color} !important; }`);
        rules.push(`.login-card label, .login-card input { color: ${dc.text_color}; }`);
        rules.push(`.auth-modern-form label, .auth-modern-form input { color: ${dc.text_color}; }`);
    }
    if (dc.button_color) {
        rules.push(`.btn-brand { background: ${dc.button_color} !important; }`);
        rules.push(`.btn-brand:hover { background: ${dc.button_color} !important; opacity: 0.9; }`);
    }
    if (dc.button_text_color) {
        rules.push(`.btn-brand { color: ${dc.button_text_color} !important; }`);
    }
    if (customCss) {
        rules.push(customCss);
    }

    return rules.length > 0 ? rules.join("\n") : null;
}
