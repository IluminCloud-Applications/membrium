import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    DEFAULT_DEVICE_CONFIG,
    type LoginPageConfig,
    type DeviceConfig,
    type DeviceMode,
} from "@/services/customization";
import { ImageUploadField } from "./ImageUploadField";
import { AdvancedCssAccordion } from "./AdvancedCssAccordion";
import { ColorPickerField } from "./ColorPickerField";

interface LoginCustomizationFormProps {
    config: LoginPageConfig;
    deviceConfig: DeviceConfig;
    deviceMode: DeviceMode;
    updateGlobal: <K extends keyof LoginPageConfig>(key: K, value: LoginPageConfig[K]) => void;
    updateDevice: <K extends keyof DeviceConfig>(key: K, value: DeviceConfig[K]) => void;
    saving: boolean;
    feedback: string | null;
    onSave: () => void;
}

export function LoginCustomizationForm({
    config,
    deviceConfig,
    deviceMode,
    updateGlobal,
    updateDevice,
    saving,
    feedback,
    onSave,
}: LoginCustomizationFormProps) {
    const isModern = config.layout === "modern";
    const label = deviceMode === "mobile" ? "Mobile" : "Desktop";

    return (
        <div className="space-y-5">
            {/* ── Global fields ─────────────────────────── */}

            <ImageUploadField
                label="Logo"
                hint="Substitui o nome da plataforma quando presente"
                currentFile={config.logo}
                onUploaded={(f) => updateGlobal("logo", f)}
                onRemoved={() => updateGlobal("logo", null)}
            />

            <div className="space-y-2">
                <Label htmlFor="loginSubtitle">Subtítulo</Label>
                <Input
                    id="loginSubtitle"
                    value={config.subtitle || ""}
                    onChange={(e) => updateGlobal("subtitle", e.target.value)}
                    placeholder="Faça login para acessar sua área de membros"
                />
                <p className="text-xs text-muted-foreground">
                    Texto abaixo do nome da plataforma
                </p>
            </div>

            {/* ── Device-specific fields ────────────────── */}

            <div className="rounded-lg border border-border p-4 space-y-5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <i className={deviceMode === "mobile" ? "ri-smartphone-line" : "ri-computer-line"} />
                    <span>Configurações — {label}</span>
                </div>

                <ImageUploadField
                    label={`Imagem de Fundo (${label})`}
                    hint={
                        isModern
                            ? "Exibida na lateral (desktop) ou como fundo (mobile)"
                            : "Fundo atrás do login"
                    }
                    currentFile={deviceConfig.background_image}
                    onUploaded={(f) => updateDevice("background_image", f)}
                    onRemoved={() => updateDevice("background_image", null)}
                />

                <DeviceColorPickers
                    deviceConfig={deviceConfig}
                    updateDevice={updateDevice}
                    isModern={isModern}
                />

                {deviceConfig.background_image && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Escurecer Fundo</Label>
                            <span className="text-xs text-muted-foreground font-mono">
                                {deviceConfig.overlay_opacity}%
                            </span>
                        </div>
                        <Slider
                            value={[deviceConfig.overlay_opacity]}
                            onValueChange={([v]) => updateDevice("overlay_opacity", v)}
                            min={0}
                            max={100}
                            step={5}
                        />
                    </div>
                )}
            </div>

            {/* ── Advanced CSS (global) ──────────────────── */}

            <AdvancedCssAccordion
                value={config.custom_css || ""}
                onChange={(css: string) => updateGlobal("custom_css", css || null)}
            />

            {/* ── Save ──────────────────────────────────── */}

            <div className="flex items-center justify-end gap-3 pt-2">
                {feedback && <span className="text-sm text-green-600">{feedback}</span>}
                <Button onClick={onSave} disabled={saving} className="btn-brand">
                    {saving ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2" />
                            Salvando...
                        </>
                    ) : (
                        "Salvar Alterações"
                    )}
                </Button>
            </div>
        </div>
    );
}

/* ─── Device Color Pickers ──────────────────────────────── */

interface DeviceColorPickersProps {
    deviceConfig: DeviceConfig;
    updateDevice: <K extends keyof DeviceConfig>(key: K, value: DeviceConfig[K]) => void;
    isModern: boolean;
}

function DeviceColorPickers({ deviceConfig, updateDevice, isModern }: DeviceColorPickersProps) {
    const pickers = [
        { key: "background_color" as const, label: "Cor de Fundo", default: DEFAULT_DEVICE_CONFIG.background_color! },
        ...(!isModern ? [{ key: "card_color" as const, label: "Cor do Card", default: DEFAULT_DEVICE_CONFIG.card_color! }] : []),
        { key: "text_color" as const, label: "Cor do Texto", default: DEFAULT_DEVICE_CONFIG.text_color! },
        { key: "button_color" as const, label: "Cor do Botão", default: DEFAULT_DEVICE_CONFIG.button_color! },
        { key: "button_text_color" as const, label: "Texto do Botão", default: DEFAULT_DEVICE_CONFIG.button_text_color! },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pickers.map(({ key, label, default: def }) => (
                <ColorPickerField
                    key={key}
                    label={label}
                    value={deviceConfig[key] as string | null}
                    onChange={(color) => updateDevice(key, color)}
                    defaultColor={def}
                />
            ))}
        </div>
    );
}
