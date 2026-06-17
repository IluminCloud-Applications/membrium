import { apiClient } from "./apiClient";
import type { AdminUser, CreateAdminRequest, UpdateAdminRequest } from "@/types/admin-user";
import type { ApiResponse } from "@/types/api";

export const adminUsersService = {
    list: () =>
        apiClient.get<AdminUser[]>("/admin-users"),

    create: (data: CreateAdminRequest) =>
        apiClient.post<ApiResponse & { admin: AdminUser }>("/admin-users", data),

    update: (id: number, data: UpdateAdminRequest) =>
        apiClient.put<ApiResponse & { admin: AdminUser }>(`/admin-users/${id}`, data),

    delete: (id: number) =>
        apiClient.delete<ApiResponse>(`/admin-users/${id}`),
};
