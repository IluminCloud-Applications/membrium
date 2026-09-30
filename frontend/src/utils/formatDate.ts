/**
 * Formata uma data ISO para o padrão brasileiro (ex: 17 Fev 2026)
 * com timezone de São Paulo (America/Sao_Paulo).
 */

const MONTHS_PT = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/**
 * Faz parse da string ISO garantindo que datas sem especificação
 * de timezone (como as salvas em UTC pelo backend) sejam interpretadas em UTC,
 * convertendo corretamente para o horário de São Paulo (UTC-3).
 */
function parseUtcDate(isoDate: string): Date {
    let dateStr = isoDate.trim();

    // Se for apenas data YYYY-MM-DD, interpreta no meio-dia UTC para evitar mudança de dia por fuso
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}T12:00:00Z`);
    }

    // Se não termina com 'Z' e não possui offset (+HH:MM, -HH:MM, etc.), consideramos UTC
    if (!dateStr.endsWith("Z") && !/[+-]\d{2}(:?\d{2})?$/.test(dateStr)) {
        dateStr = dateStr.replace(" ", "T") + "Z";
    }

    return new Date(dateStr);
}

export function formatBrazilianDate(isoDate: string | null | undefined): string {
    if (!isoDate) return "—";

    try {
        const date = parseUtcDate(isoDate);
        if (isNaN(date.getTime())) return "—";

        // Converte para timezone de São Paulo
        const spDate = new Date(
            date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        );

        const day = spDate.getDate();
        const month = MONTHS_PT[spDate.getMonth()];
        const year = spDate.getFullYear();

        return `${day} ${month} ${year}`;
    } catch {
        return "—";
    }
}

export function formatBrazilianDateTime(isoDate: string | null | undefined): string {
    if (!isoDate) return "—";

    try {
        const date = parseUtcDate(isoDate);
        if (isNaN(date.getTime())) return "—";

        // Converte para timezone de São Paulo
        const spDate = new Date(
            date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        );

        const day = String(spDate.getDate()).padStart(2, "0");
        const month = MONTHS_PT[spDate.getMonth()];
        const year = spDate.getFullYear();
        const hours = String(spDate.getHours()).padStart(2, "0");
        const minutes = String(spDate.getMinutes()).padStart(2, "0");

        return `${day} ${month} ${year} às ${hours}:${minutes}`;
    } catch {
        return "—";
    }
}
