import { apiClient } from "./apiClient";
import type {
    LoginRequest,
    LoginResponse,
    SetupRequest,
    SetupResponse,
    CheckInstallResponse,
    CheckMeResponse,
    ResetPasswordRequest,
    ApiResponse,
} from "@/types/api";

export const authService = {
    /** Check if the platform is already installed */
    checkInstall: () =>
        apiClient.get<CheckInstallResponse>("/auth/check-install"),

    /** Check current user session */
    checkMe: () =>
        apiClient.get<CheckMeResponse>("/auth/me"),

    /** Setup (first install) — create admin + platform */
    setup: (data: SetupRequest) =>
        apiClient.post<SetupResponse>("/auth/install", data),

    /** Login as admin or student */
    login: (data: LoginRequest) =>
        apiClient.post<LoginResponse>("/auth/login", data),

    /** Logout current user */
    logout: () => apiClient.post<ApiResponse>("/auth/logout", {}),

    /** Reset student password */
    resetPassword: (data: ResetPasswordRequest) =>
        apiClient.post<ApiResponse>("/auth/reset-password", data),
};
