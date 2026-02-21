import { apiClient } from "./apiClient";

/* ============================================
   SETTINGS TYPES
   ============================================ */

export interface GeneralSettings {
    platform_name: string;
    default_theme: 'light' | 'dark';
    admin_email: string;
    admin_name: string;
    support_email: string;
    support_whatsapp: string;
}

export interface UpdatePlatformPayload {
    platform_name: string;
    default_theme: 'light' | 'dark';
}

export interface UpdateAdminPayload {
    name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
}

export interface UpdateSupportPayload {
    support_email: string;
    support_whatsapp: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
}

/* ============================================
   SETTINGS SERVICE
   ============================================ */

export const settingsService = {
    /** Get all settings */
    getAll: () =>
        apiClient.get<GeneralSettings & Record<string, unknown>>("/settings"),

    /** Update platform name */
    updatePlatform: (data: UpdatePlatformPayload) =>
        apiClient.post<ApiResponse>("/settings/platform", data),

    /** Update admin info (name, email, password) */
    updateAdmin: (data: UpdateAdminPayload) =>
        apiClient.post<ApiResponse>("/settings/admin", data),

    /** Update support info (email + whatsapp) */
    updateSupport: (data: UpdateSupportPayload) =>
        apiClient.post<ApiResponse>("/settings/support", data),
};
