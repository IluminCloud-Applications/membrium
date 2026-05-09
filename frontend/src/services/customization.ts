import { apiClient } from "./apiClient";

/* ============================================
   TYPES
   ============================================ */

export type LoginLayout = "simple" | "modern" | "html";
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
    /** HTML mode fields */
    custom_html: string | null;
    custom_css_html: string | null;
    custom_js_html: string | null;
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
    custom_html: null,
    custom_css_html: null,
    custom_js_html: null,
    desktop: { ...DEFAULT_DEVICE_CONFIG },
    mobile: { ...DEFAULT_DEVICE_CONFIG },
};

export interface MemberAreaConfig {
    member_custom_css: string;
    hide_module_info: boolean;
}

export const DEFAULT_MEMBER_CONFIG: MemberAreaConfig = {
    member_custom_css: "",
    hide_module_info: false,
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

    /** Get member area CSS config (public) */
    getMemberConfig: () =>
        apiClient.get<MemberAreaConfig>("/customization/member"),

    /** Update member area config (admin only) */
    updateMemberConfig: (data: Partial<MemberAreaConfig>) =>
        apiClient.put<{ success: boolean; message: string; data: MemberAreaConfig }>("/customization/member", data),
};
