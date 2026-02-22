/* ============================================
   API TYPES — Backend contract
   ============================================ */

// Auth
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user?: {
        id: number;
        type: "admin" | "student";
        email: string;
        name?: string;
    };
}

export interface SetupRequest {
    platform_name: string;
    email: string;
    password: string;
    name?: string;
}

export interface SetupResponse {
    success: boolean;
    message: string;
}

export interface CheckInstallResponse {
    installed: boolean;
    platform_name?: string;
}

export interface ResetPasswordRequest {
    email: string;
    newPassword: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
}

export interface CheckMeResponse {
    authenticated: boolean;
    user?: {
        id: number;
        type: "admin" | "student";
        email: string;
        name: string;
    };
}
