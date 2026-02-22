import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { PromoteCtaSection } from "./PromoteCtaSection";
import type { PromoteFormData } from "./PromoteModal";

interface PromoteFormRightProps {
    form: PromoteFormData;
    onChange: (field: keyof PromoteFormData, value: string | number | boolean | File | null) => void;
    isCtaDisabled?: boolean;
}

/** Parse YYYY-MM-DD string to Date (noon to avoid timezone issues) */
function isoToDate(iso: string): Date | undefined {
    if (!iso) return undefined;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
}

/** Convert a Date to YYYY-MM-DD string */
function dateToIso(date: Date | undefined): string {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Get start of today (midnight) */
function getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function PromoteFormRight({ form, onChange, isCtaDisabled }: PromoteFormRightProps) {
    const today = getToday();
    const startDate = isoToDate(form.startDate);
    const endDate = isoToDate(form.endDate);

    // End date minimum: the later of today or startDate
    const endDateMin = startDate && startDate > today ? startDate : today;

    function handleStartDateChange(date: Date | undefined) {
        onChange("startDate", dateToIso(date));
        // If endDate is before new startDate, reset it
        if (date && endDate && date > endDate) {
            onChange("endDate", "");
        }
    }

    function handleEndDateChange(date: Date | undefined) {
        onChange("endDate", dateToIso(date));
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
                        <DatePicker
                            id="promote-start-date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            minDate={today}
                            placeholder="Selecione a data inicial"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promote-end-date">
                            Data Final <span className="text-destructive">*</span>
                        </Label>
                        <DatePicker
                            id="promote-end-date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            minDate={endDateMin}
                            placeholder="Selecione a data final"
                            required
                        />
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
