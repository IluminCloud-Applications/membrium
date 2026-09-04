import { apiClient } from "./apiClient";
import type { CourseCombo, CreateComboData, UpdateComboData } from "@/types/combo";

export interface CombosResponse {
    success: boolean;
    combos: CourseCombo[];
}

export interface SingleComboResponse {
    success: boolean;
    combo: CourseCombo;
    message?: string;
}

export interface MutationResult {
    success: boolean;
    message?: string;
}

export const combosService = {
    /** Lista todos os combos */
    list: async (): Promise<CourseCombo[]> => {
        const res = await apiClient.get<CombosResponse>("/combos");
        return res.combos || [];
    },

    /** Busca um combo pelo ID */
    get: async (id: number): Promise<CourseCombo> => {
        const res = await apiClient.get<SingleComboResponse>(`/combos/${id}`);
        return res.combo;
    },

    /** Cria um novo combo */
    create: (data: CreateComboData) =>
        apiClient.post<SingleComboResponse>("/combos", data),

    /** Atualiza um combo existente */
    update: (id: number, data: UpdateComboData) =>
        apiClient.put<SingleComboResponse>(`/combos/${id}`, data),

    /** Exclui um combo */
    delete: (id: number) =>
        apiClient.delete<MutationResult>(`/combos/${id}`),
};
