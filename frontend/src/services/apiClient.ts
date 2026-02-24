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

    /** Download a file as blob and trigger browser download */
    async downloadBlob(endpoint: string, fallbackName: string): Promise<void> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                response.status,
                errorData.message || "Erro ao baixar arquivo"
            );
        }

        // Extract filename from Content-Disposition header if available
        const disposition = response.headers.get("Content-Disposition");
        let filename = fallbackName;
        if (disposition) {
            const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match?.[1]) filename = match[1].replace(/['"]/g, "");
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
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
