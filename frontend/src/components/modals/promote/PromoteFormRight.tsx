import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromoteCtaSection } from "./PromoteCtaSection";
import type { PromoteFormData } from "./PromoteModal";

interface PromoteFormRightProps {
    form: PromoteFormData;
    onChange: (field: keyof PromoteFormData, value: string | number | boolean | File | null) => void;
    isCtaDisabled?: boolean;
}

/** Get today's date as YYYY-MM-DD */
function getTodayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function PromoteFormRight({ form, onChange, isCtaDisabled }: PromoteFormRightProps) {
    const today = getTodayISO();

    // End date minimum: whichever is later — today or startDate
    const endDateMin = form.startDate && form.startDate >= today ? form.startDate : today;

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
                            <Input
                                id="promote-start-date"
                                type="date"
                                min={today}
                                value={form.startDate}
                                onChange={(e) => {
                                    onChange("startDate", e.target.value);
                                    // If endDate is before new startDate, reset it
                                    if (form.endDate && e.target.value > form.endDate) {
                                        onChange("endDate", "");
                                    }
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promote-end-date">
                            Data Final <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="promote-end-date"
                                type="date"
                                min={endDateMin}
                                value={form.endDate}
                                onChange={(e) => onChange("endDate", e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    A promoção será exibida da data inicial até a data final.
                </p>
            </div>

            {/* CTA section */}
            <PromoteCtaSection
                hasCta={form.hasCta}
                ctaText={form.ctaText}
                ctaUrl={form.ctaUrl}
                ctaDelay={form.ctaDelay}
                mediaType={form.mediaType}
                isDisabled={isCtaDisabled}
                onToggleCta={(val: boolean) => onChange("hasCta", val)}
                onCtaTextChange={(val: string) => onChange("ctaText", val)}
                onCtaUrlChange={(val: string) => onChange("ctaUrl", val)}
                onCtaDelayChange={(val: number) => onChange("ctaDelay", val)}
            />
        </div>
    );
}
