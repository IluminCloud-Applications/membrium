/* ============================================
   STUDENT TYPES — Shared across student components
   ============================================ */

export type StudentStatus = "active" | "inactive";

export interface StudentCourse {
    id: number;
    name: string;
}

export interface CourseSourceInfo {
    course_id: number;
    course_name: string;
    category?: string;
    source: string;
    status?: "active" | "removed" | string;
    is_bonus?: boolean;
    unlocked_by?: string | null;
    combo_id?: number | null;
    combo_name?: string | null;
    transaction_id?: string | null;
    payment_method?: string | null;
    customer_code?: string | null;
    seller_id?: string | null;
    product_name?: string | null;
    offer_name?: string | null;
    price?: number | string | null;
    utms?: Record<string, string | null | undefined>;
    granted_at?: string | null;
    removed_at?: string | null;
    removed_by_source?: string | null;
    updated_at?: string | null;
}

export interface PurchaseHistoryEntry {
    action: "add" | "remove" | string;
    source: string;
    course_id?: number | null;
    course_name?: string | null;
    courses?: { id: number; name: string; category?: string }[];
    bonus_courses?: string[];
    combo_id?: number | null;
    combo_name?: string | null;
    transaction_id?: string | null;
    payment_method?: string | null;
    customer_code?: string | null;
    seller_id?: string | null;
    product_name?: string | null;
    offer_name?: string | null;
    price?: number | string | null;
    utms?: Record<string, string | null | undefined>;
    timestamp?: string | null;
    legacy_backfill?: boolean;
}

export interface Student {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status: StudentStatus;
    courses: StudentCourse[];
    createdAt: string;
    lastAccessAt?: string | null;
    emailStatus?: "opened" | "pending" | "fallback_sent" | "superseded" | string | null;
    emailOpenedAt?: string | null;
    emailLastSentAt?: string | null;
    emailStage?: number | null;
    quickAccessToken?: string;
    extra_data?: Record<string, any>;
}


export const statusLabels: Record<StudentStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
};

export const statusColors: Record<StudentStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
};

export const PLATFORM_CONFIG: Record<string, { name: string; logo?: string; icon?: string }> = {
    hotmart: { name: "Hotmart", logo: "/platforms/hotmart.png" },
    kiwify: { name: "Kiwify", logo: "/platforms/kiwify.png" },
    payt: { name: "PayT", logo: "/platforms/payt.png" },
    monetizze: { name: "Monetizze", logo: "/platforms/monetizze.png" },
    perfectpay: { name: "PerfectPay", logo: "/platforms/perfectpay.png" },
    kirvano: { name: "Kirvano", logo: "/platforms/kirvano.png" },
    lastlink: { name: "LastLink", logo: "/platforms/lastlink.png" },
    cartpanda: { name: "CartPanda", logo: "/platforms/cartpanda.svg" },
    activecampaign: { name: "Active", logo: "/platforms/active.png" },
    hubla: { name: "Hubla", logo: "/platforms/hubla.png" },
    manual: { name: "Manual", icon: "ri-user-add-line" },
};

/**
 * Extracts all unique platforms associated with a student (in chronological order),
 * safely handling both legacy students (only extra_data.source) and multi-platform history.
 */
export function getStudentSources(extraData?: Record<string, any>): string[] {
    if (!extraData || typeof extraData !== "object") return [];
    const seen = new Set<string>();
    const result: string[] = [];

    const addSource = (s: unknown) => {
        if (typeof s === "string" && s.trim()) {
            const clean = s.trim().toLowerCase();
            if (!seen.has(clean)) {
                seen.add(clean);
                result.push(clean);
            }
        }
    };

    if (extraData.first_source) addSource(extraData.first_source);
    if (Array.isArray(extraData.sources)) {
        extraData.sources.forEach(addSource);
    }
    if (extraData.course_sources && typeof extraData.course_sources === "object") {
        Object.values(extraData.course_sources).forEach((cs: any) => {
            if (cs && typeof cs === "object") addSource(cs.source);
        });
    }
    if (Array.isArray(extraData.purchase_history)) {
        extraData.purchase_history.forEach((ph: any) => {
            if (ph && typeof ph === "object") addSource(ph.source);
        });
    }
    if (extraData.source) addSource(extraData.source);

    return result;
}

