import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventPublicData {
    id: number;
    title: string;
    description: string;
    callLink: string;
    eventDate: string;
}

export function EventInvitePage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [event, setEvent] = useState<EventPublicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!eventId) return;

        const fetchEvent = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${apiUrl}/member/events/${eventId}`);
                if (!response.ok) throw new Error("Event not found");
                const data = await response.json();
                setEvent(data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <img src="/favicon.webp" alt="" className="w-12 h-12 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Carregando convite...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
                <i className="ri-calendar-close-line text-6xl text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Evento indisponível</h2>
                <p className="text-muted-foreground">Este evento não existe ou já foi encerrado.</p>
            </div>
        );
    }

    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const handleGoogleCalendar = () => {
        const formatGcal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGcal(startDate)}/${formatGcal(endDate)}`;
        const details = [];
        if (event.description) details.push(event.description);
        if (event.callLink) details.push(`Link: ${event.callLink}`);
        if (details.length > 0) url += `&details=${encodeURIComponent(details.join("\n\n"))}`;
        window.open(url, "_blank");
    };

    const handleAppleCalendar = () => {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const host = apiUrl.startsWith('http')
            ? apiUrl.replace(/^https?:\/\//, '')
            : `${window.location.host}${apiUrl}`;
        const webcalUrl = `webcal://${host}/member/events/${event.id}/calendar.ics`;
        window.location.href = webcalUrl;
    };

    const hasTimeLeft = startDate.getTime() > new Date().getTime();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background/95" style={{ fontFamily: "var(--font-sans)" }}>
            <div className="w-full max-w-[560px] mx-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                
                {/* Header Section */}
                <div className="bg-[#4A3FA0] px-8 py-10 text-center relative overflow-hidden">
                    {/* Abstract background elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-md mb-4 border border-white/10 shadow-lg">
                            <i className="ri-calendar-event-line text-3xl text-white"></i>
                        </div>
                        <p className="m-0 mb-1 text-[13px] text-white/70 tracking-widest uppercase font-semibold">
                            você está convidado
                        </p>
                        <h1 className="m-0 text-2xl sm:text-[28px] font-bold text-white leading-tight">
                            {event.title}
                        </h1>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-muted/50">
                            <div className="mt-0.5 text-[#7F77DD]">
                                <i className="ri-calendar-todo-line text-2xl"></i>
                            </div>
                            <div>
                                <p className="m-0 text-xs text-muted-foreground uppercase font-semibold tracking-wide">Data</p>
                                <p className="m-0 text-[15px] font-semibold text-foreground mt-0.5 capitalize">
                                    {format(startDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-muted/50">
                            <div className="mt-0.5 text-[#7F77DD]">
                                <i className="ri-time-line text-2xl"></i>
                            </div>
                            <div>
                                <p className="m-0 text-xs text-muted-foreground uppercase font-semibold tracking-wide">Horário</p>
                                <p className="m-0 text-[15px] font-semibold text-foreground mt-0.5">
                                    {format(startDate, "HH:mm")} h
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-muted/50">
                        <div className="mt-0.5 text-[#7F77DD]">
                            {event.callLink ? <i className="ri-video-chat-line text-2xl"></i> : <i className="ri-map-pin-line text-2xl"></i>}
                        </div>
                        <div>
                            <p className="m-0 text-xs text-muted-foreground uppercase font-semibold tracking-wide">Formato</p>
                            <p className="m-0 text-[15px] font-semibold text-foreground mt-0.5">
                                {event.callLink ? "Videochamada Online" : "Evento presencial / Sem link definido"}
                            </p>
                            {event.callLink ? (
                                <p className="m-0 mt-1 text-[13px] text-muted-foreground">O link de acesso está incluso no agendamento</p>
                            ) : null}
                        </div>
                    </div>

                    {event.description && (
                        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 transition-colors hover:bg-muted/50">
                            <p className="m-0 text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-2">Sobre o Evento</p>
                            <p className="m-0 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>
                    )}

                    <div className="border-t pt-6 text-center mt-2">
                        {hasTimeLeft ? (
                            <>
                                <p className="m-0 mb-4 text-[14px] text-muted-foreground font-medium">
                                    Confirme sua presença e adicione ao seu calendário:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={handleGoogleCalendar}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-xl font-semibold text-[15px] shadow-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <i className="ri-google-fill text-red-500 text-lg"></i>
                                        Google Calendar
                                    </button>
                                    <button
                                        onClick={handleAppleCalendar}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold text-[15px] shadow-md shadow-black/20 hover:bg-gray-900 transition-all hover:-translate-y-0.5"
                                    >
                                        <i className="ri-apple-fill text-lg"></i>
                                        Apple / Outros
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-primary/10 text-primary py-3 rounded-xl font-semibold">
                                <i className="ri-information-line mr-2" />
                                Este evento já aconteceu.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
