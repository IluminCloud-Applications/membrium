import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import type { CheckMeResponse } from "@/types/api";

export type AuthState = "loading" | "authenticated" | "unauthenticated";
export type UserType = "admin" | "student" | null;

interface UseAuthResult {
    authState: AuthState;
    userType: UserType;
    user: CheckMeResponse["user"] | null;
}

/**
 * Hook to check if the user is authenticated.
 * Returns the auth state, user type, and user info.
 */
export function useAuth(): UseAuthResult {
    const [authState, setAuthState] = useState<AuthState>("loading");
    const [userType, setUserType] = useState<UserType>(null);
    const [user, setUser] = useState<CheckMeResponse["user"] | null>(null);

    useEffect(() => {
        authService
            .checkMe()
            .then((res) => {
                if (res.authenticated && res.user) {
                    setAuthState("authenticated");
                    setUserType(res.user.type);
                    setUser(res.user);
                } else {
                    setAuthState("unauthenticated");
                }
            })
            .catch(() => {
                setAuthState("unauthenticated");
            });
    }, []);

    return { authState, userType, user };
}
