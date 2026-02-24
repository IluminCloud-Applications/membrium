import { apiClient } from "./apiClient";
import type {
    LoginRequest,
    LoginResponse,
    SetupRequest,
    SetupResponse,
    CheckInstallResponse,
    CheckMeResponse,
    ResetPasswordRequest,
    ChangePasswordRequest,
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

    /** Reset student password (direct — from login modal) */
    resetPassword: (data: ResetPasswordRequest) =>
        apiClient.post<ApiResponse>("/auth/reset-password", data),

    /** Forgot password — sends recovery email */
    forgotPassword: (email: string) =>
        apiClient.post<ApiResponse>("/auth/forgot-password", { email }),

    /** Change password by UUID (from recovery link) */
    changePassword: (data: ChangePasswordRequest) =>
        apiClient.post<ApiResponse>("/auth/change-password", data),

    /** Quick access — authenticate student by UUID token */
    quickAccess: (uuid: string) =>
        apiClient.post<LoginResponse>(`/auth/quick-access/${uuid}`, {}),
};
