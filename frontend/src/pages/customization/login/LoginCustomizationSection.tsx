import { useState, useEffect } from "react";
import { SettingsSection } from "@/components/settings";
import { LayoutSelector } from "./LayoutSelector";
import { LoginCustomizationForm } from "./LoginCustomizationForm";
import { LoginPreview } from "./LoginPreview";
import {
    customizationService,
    DEFAULT_LOGIN_CONFIG,
    DEFAULT_DEVICE_CONFIG,
    type LoginPageConfig,
    type DeviceConfig,
    type DeviceMode,
} from "@/services/customization";

export function LoginCustomizationSection() {
    const [config, setConfig] = useState<LoginPageConfig>(DEFAULT_LOGIN_CONFIG);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
    const [platformName, setPlatformName] = useState("Área de Membros");

    useEffect(() => {
        loadConfig();
        setPlatformName(document.title || "Área de Membros");
    }, []);

    async function loadConfig() {
        try {
            const data = await customizationService.getLoginConfig();
            setConfig({ ...DEFAULT_LOGIN_CONFIG, ...data });
        } catch { /* use defaults */ } finally {
            setLoaded(true);
        }
    }

    // Global field updater (layout, logo, subtitle, css)
    function updateGlobal<K extends keyof LoginPageConfig>(key: K, value: LoginPageConfig[K]) {
        setConfig((prev) => ({ ...prev, [key]: value }));
    }

    // Device-specific field updater
    function updateDevice<K extends keyof DeviceConfig>(key: K, value: DeviceConfig[K]) {
        setConfig((prev) => ({
            ...prev,
            [deviceMode]: { ...prev[deviceMode], [key]: value },
        }));
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await customizationService.updateLoginConfig(config);
            setFeedback(res.message);
        } catch {
            setFeedback("Erro ao salvar personalização");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    if (!loaded) return null;

    const activeDevice = config[deviceMode] || { ...DEFAULT_DEVICE_CONFIG };

    return (
        <SettingsSection
            icon="ri-lock-line"
            title="Personalização de Login"
            description="Escolha o layout e personalize a aparência da página de login."
        >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left: Controls */}
                <div className="space-y-6">
                    <LayoutSelector
                        value={config.layout}
                        onChange={(layout) => updateGlobal("layout", layout)}
                    />
                    <LoginCustomizationForm
                        config={config}
                        deviceConfig={activeDevice}
                        deviceMode={deviceMode}
                        updateGlobal={updateGlobal}
                        updateDevice={updateDevice}
                        saving={saving}
                        feedback={feedback}
                        onSave={handleSave}
                    />
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col items-center">
                    <LoginPreview
                        config={config}
                        deviceMode={deviceMode}
                        onDeviceModeChange={setDeviceMode}
                        platformName={platformName}
                    />
                </div>
            </div>
        </SettingsSection>
    );
}
