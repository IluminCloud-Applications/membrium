export type AdminRole = 'admin' | 'support';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: AdminRole;
    is_primary: boolean;
}

export interface CreateAdminRequest {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
}

export interface UpdateAdminRequest {
    name?: string;
    email?: string;
    password?: string;
    role?: AdminRole;
}
