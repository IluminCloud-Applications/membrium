import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromoteCtaSection } from "./PromoteCtaSection";
import type { PromoteFormData } from "./PromoteModal";

interface PromoteFormRightProps {
    form: PromoteFormData;
    onChange: (field: keyof PromoteFormData, value: string | number | boolean | File | null) => void;
}

/** Convert ISO yyyy-mm-dd → dd/mm/yyyy for display */
function isoToDisplay(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

/** Convert dd/mm/yyyy → ISO yyyy-mm-dd for storage */
function displayToIso(display: string): string {
    const clean = display.replace(/\D/g, "");
    if (clean.length < 8) return "";
    const d = clean.slice(0, 2);
    const m = clean.slice(2, 4);
    const y = clean.slice(4, 8);
    return `${y}-${m}-${d}`;
}

/** Auto-format as user types: dd/mm/yyyy */
function formatDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function PromoteFormRight({ form, onChange }: PromoteFormRightProps) {
    function handleDateChange(field: "startDate" | "endDate", rawValue: string) {
        const formatted = formatDateInput(rawValue);
        // Store as ISO when we have a complete date (dd/mm/yyyy = 10 chars)
        if (formatted.length === 10) {
            onChange(field, displayToIso(formatted));
        } else {
            // Store raw during typing so we can convert back
            onChange(field, formatted.length > 0 ? `__raw__${formatted}` : "");
        }
    }

    function getDisplayValue(isoOrRaw: string): string {
        if (!isoOrRaw) return "";
        if (isoOrRaw.startsWith("__raw__")) return isoOrRaw.replace("__raw__", "");
        return isoToDisplay(isoOrRaw);
    }

    return (
        <div className="space-y-5">
            {/* Period section */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <i className="ri-calendar-line text-primary" />
                    Período de Exibição
                </h4>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="promote-start-date">
                            Data Inicial <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                id="promote-start-date"
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/aaaa"
                                maxLength={10}
                                value={getDisplayValue(form.startDate)}
                                onChange={(e) => handleDateChange("startDate", e.target.value)}
                                className="pl-9"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promote-end-date">
                            Data Final <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                id="promote-end-date"
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/aaaa"
                                maxLength={10}
                                value={getDisplayValue(form.endDate)}
                                onChange={(e) => handleDateChange("endDate", e.target.value)}
                                className="pl-9"
                                required
                            />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    A promoção será exibida da data inicial até o dia anterior à data final.
                </p>
            </div>

            {/* CTA section */}
            <PromoteCtaSection
                hasCta={form.hasCta}
                ctaText={form.ctaText}
                ctaUrl={form.ctaUrl}
                ctaDelay={form.ctaDelay}
                onToggleCta={(val: boolean) => onChange("hasCta", val)}
                onCtaTextChange={(val: string) => onChange("ctaText", val)}
                onCtaUrlChange={(val: string) => onChange("ctaUrl", val)}
                onCtaDelayChange={(val: number) => onChange("ctaDelay", val)}
            />
        </div>
    );
}
