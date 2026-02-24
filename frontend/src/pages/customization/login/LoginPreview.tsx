import { DEFAULT_DEVICE_CONFIG, type LoginPageConfig, type DeviceMode } from "@/services/customization";
import { cn } from "@/lib/utils";

interface LoginPreviewProps {
    config: LoginPageConfig;
    deviceMode: DeviceMode;
    onDeviceModeChange: (mode: DeviceMode) => void;
    platformName: string;
}

export function LoginPreview({ config, deviceMode, onDeviceModeChange, platformName }: LoginPreviewProps) {
    const dc = config[deviceMode] || { ...DEFAULT_DEVICE_CONFIG };
    const bgImage = dc.background_image ? `/static/uploads/${dc.background_image}` : null;
    const logoUrl = config.logo ? `/static/uploads/${config.logo}` : null;
    const subtitle = config.subtitle || "Faça login para acessar sua área de membros";
    const tc = dc.text_color || DEFAULT_DEVICE_CONFIG.text_color!;
    const bc = dc.button_color || DEFAULT_DEVICE_CONFIG.button_color!;
    const btc = dc.button_text_color || DEFAULT_DEVICE_CONFIG.button_text_color!;
    const bgc = dc.background_color || DEFAULT_DEVICE_CONFIG.background_color!;
    const cc = dc.card_color || DEFAULT_DEVICE_CONFIG.card_color!;
    const isMobile = deviceMode === "mobile";

    return (
        <div className="w-full space-y-3">
            {/* Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <i className="ri-eye-line" />
                    <span>Preview</span>
                </div>
                <DeviceToggle mode={deviceMode} onChange={onDeviceModeChange} />
            </div>

            {/* Preview */}
            <div className="flex justify-center">
                <div
                    className={cn(
                        "relative rounded-xl border border-border overflow-hidden shadow-lg transition-all duration-300",
                        isMobile ? "w-[200px] h-[360px]" : "w-full h-[280px]"
                    )}
                >
                    {config.layout === "simple" ? (
                        <SimplePreview {...{ bgImage, bgc, cc, tc, bc, btc, logoUrl, platformName, subtitle, isMobile, overlay: dc.overlay_opacity }} />
                    ) : (
                        <ModernPreview {...{ bgImage, bgc, tc, bc, btc, logoUrl, platformName, subtitle, isMobile, overlay: dc.overlay_opacity }} />
                    )}
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
                Visualização em miniatura — a página real será em tela cheia.
            </p>
        </div>
    );
}

/* ─── Device toggle ─────────────────────────────────────── */

function DeviceToggle({ mode, onChange }: { mode: DeviceMode; onChange: (m: DeviceMode) => void }) {
    return (
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {(["mobile", "desktop"] as const).map((m) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => onChange(m)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        mode === m
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <i className={m === "mobile" ? "ri-smartphone-line" : "ri-computer-line"} />
                    {m === "mobile" ? "Mobile" : "Desktop"}
                </button>
            ))}
        </div>
    );
}

/* ─── Shared types for sub-previews ─────────────────────── */

interface PProps {
    bgImage: string | null;
    bgc: string;
    cc?: string;
    tc: string;
    bc: string;
    btc: string;
    logoUrl: string | null;
    platformName: string;
    subtitle: string;
    isMobile: boolean;
    overlay: number;
}

/* ─── Simple Layout ─────────────────────────────────────── */

function SimplePreview({ bgImage, bgc, cc, tc, bc, btc, logoUrl, platformName, subtitle, isMobile, overlay }: PProps) {
    return (
        <div className="w-full h-full flex items-center justify-center relative" style={{ backgroundColor: bgc }}>
            <BgLayer src={bgImage} overlay={overlay} />

            <div
                className="relative z-10 rounded-lg shadow-xl text-center"
                style={{
                    width: isMobile ? "80%" : "45%",
                    maxWidth: "160px",
                    padding: isMobile ? "12px 10px" : "10px 8px",
                    backgroundColor: cc,
                    color: tc,
                }}
            >
                <LogoOrName logoUrl={logoUrl} name={platformName} size={isMobile ? "9px" : "8px"} logoH={isMobile ? "20px" : "16px"} />
                <p className="mb-2 truncate opacity-70" style={{ fontSize: isMobile ? "6px" : "5px" }}>{subtitle}</p>
                <FormSkeleton h={isMobile ? "16px" : "12px"} tc={tc} bc={bc} btc={btc} />
            </div>
        </div>
    );
}

/* ─── Modern Layout ─────────────────────────────────────── */

function ModernPreview({ bgImage, bgc, tc, bc, btc, logoUrl, platformName, subtitle, isMobile, overlay }: PProps) {
    if (isMobile) {
        return (
            <div className="w-full h-full relative">
                {bgImage ? <BgLayer src={bgImage} overlay={overlay} /> : <div className="absolute inset-0" style={{ backgroundColor: bgc }} />}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-3">
                    <div className="w-full max-w-[85%] space-y-1.5 text-center" style={{ color: tc }}>
                        <BrandBadge logoUrl={logoUrl} name={platformName} />
                        <GradientTitle />
                        <p className="text-[5px] truncate opacity-70">{subtitle}</p>
                        <FormSkeleton h="14px" tc={tc} bc={bc} btc={btc} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex">
            <div className="w-1/2 flex flex-col p-3" style={{ backgroundColor: bgc, color: tc }}>
                <BrandBadge logoUrl={logoUrl} name={platformName} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-[85%] space-y-1.5">
                        <GradientTitle />
                        <p className="text-[5px] truncate opacity-70">{subtitle}</p>
                        <FormSkeleton h="10px" tc={tc} bc={bc} btc={btc} />
                    </div>
                </div>
            </div>
            <div className="w-1/2 relative bg-gray-200 dark:bg-zinc-800">
                {bgImage ? <BgLayer src={bgImage} overlay={overlay} /> : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-zinc-600">
                        <i className="ri-image-line text-2xl" />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Shared helpers ────────────────────────────────────── */

function BgLayer({ src, overlay }: { src: string | null; overlay: number }) {
    if (!src) return null;
    return (
        <>
            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay / 100})` }} />
        </>
    );
}

function LogoOrName({ logoUrl, name, size, logoH }: { logoUrl: string | null; name: string; size: string; logoH: string }) {
    if (logoUrl) return <img src={logoUrl} alt="Logo" className="mx-auto mb-1.5 object-contain" style={{ height: logoH }} />;
    return (
        <div className="font-extrabold mb-0.5" style={{ fontSize: size, background: "linear-gradient(135deg, #E62020, #F06422)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {name}
        </div>
    );
}

function BrandBadge({ logoUrl, name }: { logoUrl: string | null; name: string }) {
    if (logoUrl) return <img src={logoUrl} alt="Logo" className="h-3.5 object-contain" />;
    return (
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-red-500 to-orange-500 shrink-0" />
            <span className="text-[6px] font-semibold truncate">{name}</span>
        </div>
    );
}

function GradientTitle() {
    return (
        <div className="text-[8px] font-bold" style={{ background: "linear-gradient(135deg, #E62020, #F06422)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Bem-vindo
        </div>
    );
}

function FormSkeleton({ h, tc, bc, btc }: { h: string; tc: string; bc: string; btc: string }) {
    return (
        <div className="space-y-1 pt-1">
            <div className="rounded-sm opacity-15" style={{ height: h, backgroundColor: tc }} />
            <div className="rounded-sm opacity-15" style={{ height: h, backgroundColor: tc }} />
            <div className="rounded-sm mt-1 flex items-center justify-center" style={{ height: h, background: bc }}>
                <span style={{ fontSize: "5px", color: btc, fontWeight: 600 }}>Entrar</span>
            </div>
        </div>
    );
}
