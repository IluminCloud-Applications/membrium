import { apiClient } from "./apiClient";

/* ============================================
   INTEGRATION TYPES
   ============================================ */

export interface BrevoSettings {
    enabled: boolean;
    api_key: string;
    sender_name: string;
    sender_email: string;
    email_subject: string;
    email_template: string;
    template_mode: "simple" | "html";
    forgot_email_subject: string;
    forgot_email_template: string;
    forgot_template_mode: "simple" | "html";
}

export interface EvolutionSettings {
    enabled: boolean;
    url: string;
    api_key: string;
    version: string;
    instance: string;
    message_template: string;
    template_mode: "simple" | "html";
}

export interface YouTubeSettings {
    enabled: boolean;
    client_id: string;
    client_secret: string;
    connected: boolean;
    channel_name: string;
    channel_id: string;
}

export interface IntegrationsData {
    brevo: BrevoSettings;
    evolution: EvolutionSettings;
    youtube: YouTubeSettings;
}

interface ApiResponse {
    success: boolean;
    message: string;
}

interface DetectVersionResponse {
    success: boolean;
    version?: string;
    message?: string;
}

export interface EvolutionInstance {
    name: string;
    status: string;
    phone: string;
}

interface FetchInstancesResponse {
    success: boolean;
    instances?: EvolutionInstance[];
    message?: string;
}

interface YouTubeAuthUrlResponse {
    success: boolean;
    auth_url?: string;
    message?: string;
}

interface YouTubeCallbackResponse {
    success: boolean;
    message: string;
    channel_name?: string;
    channel_id?: string;
}

interface YouTubeStatusResponse {
    connected: boolean;
    channel_name: string;
    channel_id: string;
}

/* ============================================
   INTEGRATIONS SERVICE
   ============================================ */

export const integrationsService = {
    /** Get all integrations */
    getAll: () =>
        apiClient.get<IntegrationsData>("/settings/integrations"),

    /** Update Brevo settings */
    updateBrevo: (data: Partial<BrevoSettings>) =>
        apiClient.post<ApiResponse>("/settings/brevo", data),

    /** Update Evolution API settings */
    updateEvolution: (data: Partial<EvolutionSettings>) =>
        apiClient.post<ApiResponse>("/settings/evolution", data),

    /** Detect Evolution API version */
    detectEvolutionVersion: (url: string, api_key: string) =>
        apiClient.post<DetectVersionResponse>("/settings/evolution/detect-version", { url, api_key }),

    /** Fetch available WhatsApp instances */
    fetchEvolutionInstances: (url: string, api_key: string) =>
        apiClient.post<FetchInstancesResponse>("/settings/evolution/instances", { url, api_key }),

    /** Update YouTube settings */
    updateYouTube: (data: Partial<YouTubeSettings>) =>
        apiClient.post<ApiResponse>("/settings/youtube", data),

    /** Get YouTube OAuth URL */
    getYouTubeAuthUrl: (redirect_uri: string) =>
        apiClient.post<YouTubeAuthUrlResponse>("/youtube/auth-url", { redirect_uri }),

    /** Exchange YouTube auth code for tokens */
    youTubeCallback: (code: string, redirect_uri: string) =>
        apiClient.post<YouTubeCallbackResponse>("/youtube/callback", { code, redirect_uri }),

    /** Get YouTube connection status */
    getYouTubeStatus: () =>
        apiClient.get<YouTubeStatusResponse>("/youtube/status"),

    /** Disconnect YouTube channel */
    disconnectYouTube: () =>
        apiClient.post<ApiResponse>("/youtube/disconnect", {}),
};
