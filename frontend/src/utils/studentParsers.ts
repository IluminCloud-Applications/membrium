export interface ParsedStudent {
    name: string;
    email: string;
    phone?: string;
}

function cleanPhone(val: string): string {
    return val.replace(/[^\d+]/g, '');
}

function isPhone(val: string): boolean {
    const clean = cleanPhone(val);
    return clean.length >= 8 && clean.length <= 16;
}

/**
 * Parse pasted text into student entries.
 * Supports: "email", "name, email", "email, name", "name, email, phone", etc.
 */
export function parseTextToStudents(text: string): ParsedStudent[] {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const result: ParsedStudent[] = [];

    for (const line of lines) {
        const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length === 0) continue;

        const emailIdx = parts.findIndex(isEmail);
        if (emailIdx === -1) continue;

        const email = parts[emailIdx].toLowerCase();
        const remainingParts = parts.filter((_, idx) => idx !== emailIdx);
        let name = "";
        let phone = "";

        if (remainingParts.length > 0) {
            const phoneIdx = remainingParts.findIndex(isPhone);
            if (phoneIdx !== -1) {
                phone = cleanPhone(remainingParts[phoneIdx]);
                name = remainingParts.filter((_, idx) => idx !== phoneIdx).join(" ");
            } else {
                name = remainingParts.join(" ");
            }
        }

        result.push({ name, email, phone: phone || undefined });
    }

    return deduplicateByEmail(result);
}

/**
 * Parse CSV/TXT content into student entries.
 */
export function parseCSV(content: string, hasHeader: boolean): ParsedStudent[] {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const startIdx = hasHeader ? 1 : 0;
    const result: ParsedStudent[] = [];

    for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length === 0) continue;

        const emailIdx = parts.findIndex(isEmail);
        if (emailIdx === -1) continue;

        const email = parts[emailIdx].toLowerCase();
        const remainingParts = parts.filter((_, idx) => idx !== emailIdx);
        let name = "";
        let phone = "";

        if (remainingParts.length > 0) {
            const phoneIdx = remainingParts.findIndex(isPhone);
            if (phoneIdx !== -1) {
                phone = cleanPhone(remainingParts[phoneIdx]);
                name = remainingParts.filter((_, idx) => idx !== phoneIdx).join(" ");
            } else {
                name = remainingParts.join(" ");
            }
        }

        result.push({ name, email, phone: phone || undefined });
    }

    return deduplicateByEmail(result);
}

function isEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function deduplicateByEmail(arr: ParsedStudent[]): ParsedStudent[] {
    const seen = new Set<string>();
    return arr.filter((s) => {
        const key = s.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
