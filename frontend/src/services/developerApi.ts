import { apiClient } from "./apiClient";

export interface DeveloperApiResponse {
    success: boolean;
    has_key: boolean;
    api_key: string;
    base_url: string;
    message?: string;
}

export const developerApiService = {
    get: () => apiClient.get<DeveloperApiResponse>("/settings/developer-api"),
    generate: () => apiClient.post<DeveloperApiResponse>("/settings/developer-api/generate", {}),
    revoke: () => apiClient.delete<DeveloperApiResponse>("/settings/developer-api/revoke"),
};
