import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsHeader } from "@/components/settings";
import { AddAdminModal } from "@/components/modals/admin/AddAdminModal";
import { EditAdminModal } from "@/components/modals/admin/EditAdminModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { adminUsersService } from "@/services/adminUsers";
import { toast } from "sonner";
import type { AdminUser, CreateAdminRequest, UpdateAdminRequest } from "@/types/admin-user";

export function UsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal states
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

    const fetchAdmins = useCallback(async () => {
        try {
            const data = await adminUsersService.list();
            setAdmins(data);
        } catch {
            toast.error("Erro ao carregar administradores.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

    async function handleCreate(data: CreateAdminRequest) {
        setActionLoading(true);
        try {
            await adminUsersService.create(data);
            toast.success("Administrador criado com sucesso!");
            setAddOpen(false);
            fetchAdmins();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao criar administrador.");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleUpdate(id: number, data: UpdateAdminRequest) {
        setActionLoading(true);
        try {
            await adminUsersService.update(id, data);
            toast.success("Administrador atualizado com sucesso!");
            setEditOpen(false);
            fetchAdmins();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar administrador.");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete() {
        if (!selectedAdmin) return;
        setActionLoading(true);
        try {
            await adminUsersService.delete(selectedAdmin.id);
            toast.success("Administrador excluído com sucesso!");
            setDeleteOpen(false);
            setSelectedAdmin(null);
            fetchAdmins();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao excluir administrador.");
        } finally {
            setActionLoading(false);
        }
    }

    const roleLabel = (role: string) => role === "admin" ? "Administrador" : "Suporte";
    const roleVariant = (role: string) => role === "admin" ? "default" as const : "secondary" as const;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
                <SettingsHeader
                    icon="ri-user-settings-line"
                    title="Usuários"
                    description="Gerencie os administradores da plataforma e suas permissões."
                />
                <Button onClick={() => setAddOpen(true)} className="shrink-0">
                    <i className="ri-user-add-line mr-2" />
                    Adicionar
                </Button>
            </div>

            {/* Admin Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    <i className="ri-loader-4-line animate-spin mr-2" />
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : admins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhum administrador encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {admin.name || "Sem nome"}
                                            {admin.is_primary && (
                                                <i className="ri-shield-star-line text-amber-500" title="Administrador principal" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={roleVariant(admin.role)}>{roleLabel(admin.role)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <AdminActionsDropdown
                                            admin={admin}
                                            onEdit={() => { setSelectedAdmin(admin); setEditOpen(true); }}
                                            onDelete={() => { setSelectedAdmin(admin); setDeleteOpen(true); }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modals */}
            <AddAdminModal open={addOpen} onOpenChange={setAddOpen} onSubmit={handleCreate} isLoading={actionLoading} />
            <EditAdminModal open={editOpen} onOpenChange={setEditOpen} admin={selectedAdmin} onSubmit={handleUpdate} isLoading={actionLoading} />
            <DeleteConfirmModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                title="Excluir administrador?"
                description={`Tem certeza que deseja excluir o administrador "${selectedAdmin?.name || selectedAdmin?.email}"? Esta ação não pode ser desfeita.`}
                isLoading={actionLoading}
            />
        </div>
    );
}

/** Dropdown menu for admin actions */
function AdminActionsDropdown({ admin, onEdit, onDelete }: {
    admin: AdminUser;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <i className="ri-more-2-fill" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <i className="ri-pencil-line mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={onDelete}
                    disabled={admin.is_primary}
                    className="text-destructive focus:text-destructive"
                >
                    <i className="ri-delete-bin-line mr-2" /> Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
