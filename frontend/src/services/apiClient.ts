const API_BASE = "/api";

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const customHeaders = options.headers as Record<string, string> | undefined;
        const isEmptyHeaders = customHeaders && Object.keys(customHeaders).length === 0;

        // If headers is an empty object {}, it means "don't set any default headers" (e.g., FormData)
        // If headers has values, spread them. If no headers provided, use default JSON Content-Type.
        const finalHeaders: Record<string, string> = isEmptyHeaders
            ? {}
            : customHeaders
                ? { ...customHeaders }
                : { "Content-Type": "application/json" };

        const config: RequestInit = {
            ...options,
            headers: finalHeaders,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                response.status,
                errorData.message || "Erro interno do servidor"
            );
        }

        return response.json();
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    async post<T>(endpoint: string, body: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async put<T>(endpoint: string, body: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async patch<T>(endpoint: string, body: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }
}

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

export const apiClient = new ApiClient(API_BASE);
