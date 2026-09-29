/**
 * Formata uma data ISO para o padrão brasileiro (ex: 17 Fev 2026)
 * com timezone de São Paulo (America/Sao_Paulo).
 */

const MONTHS_PT = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatBrazilianDate(isoDate: string | null | undefined): string {
    if (!isoDate) return "—";

    try {
        const date = new Date(isoDate);

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
        const date = new Date(isoDate);

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
