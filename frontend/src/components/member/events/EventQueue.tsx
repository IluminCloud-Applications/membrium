import { useState, useEffect, useCallback } from "react";
import type { MemberActiveEvent } from "@/types/member";
import { memberService } from "@/services/member";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "membrium_event_dismissed";
const COOLDOWN_HOURS = 6;

interface EventQueueProps {
    events: MemberActiveEvent[];
}

export function EventQueue({ events }: EventQueueProps) {
    const [queue, setQueue] = useState<MemberActiveEvent[]>([]);

    useEffect(() => {
        const dismissed = getDismissedMap();
        const now = Date.now();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        const filtered = events.filter((event) => {
            const dismissedAt = dismissed[event.id];
            if (!dismissedAt) return true;
            return now - dismissedAt >= cooldownMs;
        });

        setQueue(filtered);
    }, [events]);

    const handleDismiss = useCallback((eventId: number) => {
        const dismissed = getDismissedMap();
        dismissed[eventId] = Date.now();
        saveDismissedMap(dismissed);

        setQueue((prev) => prev.filter((p) => p.id !== eventId));
    }, []);

    if (queue.length === 0) return null;

    const current = queue[0];
    return (
        <EventModalInner
            key={current.id}
            event={current}
            onDismiss={handleDismiss}
        />
    );
}

interface EventModalInnerProps {
    event: MemberActiveEvent;
    onDismiss: (eventId: number) => void;
}

function EventModalInner({ event, onDismiss }: EventModalInnerProps) {
    const [closing, setClosing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

    useEffect(() => {
        memberService.trackEventView(event.id).catch(() => { });

        // Countdown timer
        if (event.eventDate) {
            const target = new Date(event.eventDate).getTime();
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const diff = target - now;
                if (diff <= 0) {
                    setTimeLeft(null);
                    clearInterval(interval);
                } else {
                    setTimeLeft({
                        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                        s: Math.floor((diff % (1000 * 60)) / 1000),
                    });
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [event.id, event.eventDate]);

    function handleClose() {
        setClosing(true);
        setTimeout(() => onDismiss(event.id), 300);
    }

    const handleCallClick = useCallback(() => {
        if (event.callLink) {
            memberService.trackEventClick(event.id).catch(() => { });
            window.open(event.callLink, "_blank", "noopener,noreferrer");
        }
    }, [event.id, event.callLink]);

    return (
        <div className={`promo-modal-overlay ${closing ? "promo-modal-closing" : ""}`}>
            <div className={`promo-modal ${closing ? "promo-modal-exit" : ""}`}>
                <button className="promo-modal-close" onClick={handleClose} aria-label="Fechar">
                    <i className="ri-close-line" />
                </button>

                {event.mediaType !== "default" && (
                    <div className="promo-modal-media p-4 sm:p-0 flex items-center justify-center bg-muted/20">
                        {event.mediaType === "html" ? (
                            <div
                                className="w-full h-full p-4 overflow-auto prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: event.htmlContent || "" }}
                            />
                        ) : (
                            <div
                                className={event.callLink ? "promo-modal-media-clickable" : ""}
                                onClick={event.callLink ? handleCallClick : undefined}
                                role={event.callLink ? "link" : undefined}
                            >
                                <img
                                    className="promo-modal-image"
                                    src={event.mediaUrl}
                                    alt={event.description}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
                {event.mediaType === "default" && (
                    <div className="p-8 pb-0 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <i className="ri-calendar-event-line text-3xl"></i>
                        </div>
                    </div>
                )}

                <div className={`promo-modal-content ${event.mediaType === "default" ? "text-center pt-2" : ""}`}>
                    <h3 className="text-xl font-bold text-foreground mb-2">{event.title}</h3>
                    {event.description && (
                        <p className="promo-modal-description mb-4">{event.description}</p>
                    )}

                    {timeLeft ? (
                        <div className="flex items-center gap-4 mb-4 justify-center bg-muted/30 p-3 rounded-lg border">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-primary">{String(timeLeft.d).padStart(2, "0")}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dias</span>
                            </div>
                            <span className="text-muted-foreground font-bold">:</span>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-primary">{String(timeLeft.h).padStart(2, "0")}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Horas</span>
                            </div>
                            <span className="text-muted-foreground font-bold">:</span>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-primary">{String(timeLeft.m).padStart(2, "0")}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Min</span>
                            </div>
                            <span className="text-muted-foreground font-bold">:</span>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-primary">{String(timeLeft.s).padStart(2, "0")}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Seg</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 text-center text-primary font-semibold py-2 bg-primary/10 rounded-lg">
                            O evento está acontecendo ou já passou!
                        </div>
                    )}

                    {event.callLink && (
                        <div className="flex justify-center mt-4">
                            {(!timeLeft || (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m <= 30)) ? (
                                <Button onClick={handleCallClick} className="w-full btn-brand text-lg py-6 shadow-lg shadow-primary/20">
                                    <i className="ri-vidicon-line mr-2" />
                                    Acessar Chamada
                                </Button>
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <Button 
                                        onClick={() => {
                                            const startDate = new Date(event.eventDate);
                                            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                                            const formatGcal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
                                            let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGcal(startDate)}/${formatGcal(endDate)}`;
                                            const details = [];
                                            if (event.description) details.push(event.description);
                                            if (event.callLink) details.push(`Link: ${event.callLink}`);
                                            if (details.length > 0) url += `&details=${encodeURIComponent(details.join("\n\n"))}`;
                                            window.open(url, "_blank");
                                        }}
                                        className="flex-1 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 text-sm py-6 shadow-sm"
                                    >
                                        <i className="ri-google-fill mr-2 text-red-500" />
                                        Google
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                        const apiUrl = import.meta.env.VITE_API_URL || '/api';
                                        const host = apiUrl.startsWith('http') 
                                            ? apiUrl.replace(/^https?:\/\//, '') 
                                            : `${window.location.host}${apiUrl}`;
                                        const webcalUrl = `webcal://${host}/member/events/${event.id}/calendar.ics`;
                                            window.location.href = webcalUrl;
                                        }} 
                                        className="flex-1 bg-black hover:bg-gray-900 text-white text-sm py-6 shadow-sm shadow-black/20"
                                    >
                                        <i className="ri-apple-fill mr-2 text-lg" />
                                        Apple / Outros
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getDismissedMap(): Record<number, number> {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveDismissedMap(map: Record<number, number>) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}
