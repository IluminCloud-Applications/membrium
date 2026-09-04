import { useState, useEffect, useCallback } from "react";
import type { CourseCombo } from "@/types/combo";
import { combosService } from "@/services/combosService";
import { toast } from "sonner";

export function useCombos() {
    const [combos, setCombos] = useState<CourseCombo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCombos = useCallback(async () => {
        try {
            const data = await combosService.list();
            setCombos(data);
        } catch (err) {
            console.error("Erro ao carregar combos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCombos();
    }, [fetchCombos]);

    const deleteCombo = async (id: number) => {
        try {
            await combosService.delete(id);
            toast.success("Combo excluído com sucesso");
            await fetchCombos();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao excluir combo";
            toast.error(message);
            return false;
        }
    };

    return { combos, loading, refetch: fetchCombos, deleteCombo };
}
