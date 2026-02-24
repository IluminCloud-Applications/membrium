import { apiClient } from "./apiClient";

/* ============================================
   TYPES
   ============================================ */

export type LoginLayout = "simple" | "modern";
export type DeviceMode = "desktop" | "mobile";

/** Per-device visual config */
export interface DeviceConfig {
    background_image: string | null;
    background_color: string | null;
    card_color: string | null;
    button_color: string | null;
    button_text_color: string | null;
    text_color: string | null;
    overlay_opacity: number;
}

/** Full login page config (global + per-device) */
export interface LoginPageConfig {
    layout: LoginLayout;
    logo: string | null;
    subtitle: string | null;
    custom_css: string | null;
    desktop: DeviceConfig;
    mobile: DeviceConfig;
}

/* ============================================
   DEFAULTS
   ============================================ */

export const DEFAULT_DEVICE_CONFIG: DeviceConfig = {
    background_image: null,
    background_color: "#1f1f1f",
    card_color: "#2b2b2b",
    button_color: "#E62020",
    button_text_color: "#ffffff",
    text_color: "#f2f2f2",
    overlay_opacity: 50,
};

export const DEFAULT_LOGIN_CONFIG: LoginPageConfig = {
    layout: "simple",
    logo: null,
    subtitle: "Faça login para acessar sua área de membros",
    custom_css: null,
    desktop: { ...DEFAULT_DEVICE_CONFIG },
    mobile: { ...DEFAULT_DEVICE_CONFIG },
};

/* ============================================
   API TYPES
   ============================================ */

interface ApiResponse {
    success: boolean;
    message: string;
    data?: LoginPageConfig;
}

interface UploadResponse {
    success: boolean;
    message: string;
    filename: string;
}

/* ============================================
   SERVICE
   ============================================ */

export const customizationService = {
    /** Get login config (public — no auth needed) */
    getLoginConfig: () =>
        apiClient.get<LoginPageConfig>("/customization/login"),

    /** Update login config (admin only) */
    updateLoginConfig: (data: Partial<LoginPageConfig>) =>
        apiClient.put<ApiResponse>("/customization/login", data),

    /** Upload image — just saves file and returns filename */
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.request<UploadResponse>("/customization/login/upload", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },

    /** Delete an uploaded image by filename */
    deleteImage: (filename: string) =>
        apiClient.delete<ApiResponse>(`/customization/login/image/${filename}`),
};
