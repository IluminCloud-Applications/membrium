/**
 * Parse pasted text into student entries.
 * Supports: "email", "name, email", "email, name", "name;email", "name\temail"
 */
export function parseTextToStudents(text: string): { name: string; email: string }[] {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const result: { name: string; email: string }[] = [];

    for (const line of lines) {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        if (parts.length >= 2 && isEmail(parts[1])) {
            result.push({ name: parts[0], email: parts[1] });
        } else if (parts.length >= 2 && isEmail(parts[0])) {
            result.push({ name: parts[1], email: parts[0] });
        } else if (isEmail(parts[0])) {
            result.push({ name: "", email: parts[0] });
        }
    }

    return deduplicateByEmail(result);
}

/**
 * Parse CSV/TXT content into student entries.
 */
export function parseCSV(content: string, hasHeader: boolean): { name: string; email: string }[] {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const startIdx = hasHeader ? 1 : 0;
    const result: { name: string; email: string }[] = [];

    for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());

        if (parts.length >= 2 && isEmail(parts[1])) {
            result.push({ name: parts[0], email: parts[1] });
        } else if (parts.length >= 2 && isEmail(parts[0])) {
            result.push({ name: parts[1], email: parts[0] });
        } else if (isEmail(parts[0])) {
            result.push({ name: "", email: parts[0] });
        }
    }

    return deduplicateByEmail(result);
}

function isEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function deduplicateByEmail(arr: { name: string; email: string }[]): { name: string; email: string }[] {
    const seen = new Set<string>();
    return arr.filter((s) => {
        const key = s.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
