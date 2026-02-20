import type { FileItem, DiskUsage } from "@/types/file";

export const mockFiles: FileItem[] = [
    {
        id: 1,
        filename: "cover_1.jpg",
        is_used: true,
        used_in: ["Capa do curso ID 1"],
        size: 524288,
        upload_date: "2026-02-20",
    },
    {
        id: 2,
        filename: "modulo_intro.jpg",
        is_used: true,
        used_in: ["Imagem de módulo"],
        size: 312000,
        upload_date: "2026-02-19",
    },
    {
        id: 3,
        filename: "banner_promo.png",
        is_used: true,
        used_in: ["Imagem de promoção"],
        size: 1048576,
        upload_date: "2026-02-18",
    },
    {
        id: -1,
        filename: "foto_antiga.jpg",
        is_used: false,
        used_in: [],
        size: 256000,
        upload_date: "2026-02-15",
    },
    {
        id: -1,
        filename: "rascunho.png",
        is_used: false,
        used_in: [],
        size: 890000,
        upload_date: "2026-02-14",
    },
    {
        id: 4,
        filename: "material_aula.pdf",
        is_used: true,
        used_in: ["Documento de aula"],
        size: 2097152,
        upload_date: "2026-02-13",
    },
    {
        id: -1,
        filename: "backup_logo.webp",
        is_used: false,
        used_in: [],
        size: 150000,
        upload_date: "2026-02-10",
    },
    {
        id: 5,
        filename: "vitrine_destaque.jpg",
        is_used: true,
        used_in: ["Imagem de vitrine"],
        size: 780000,
        upload_date: "2026-02-12",
    },
];

export const mockDiskUsage: DiskUsage = {
    used: 5368709120, // ~5 GB
    total: 10737418240, // ~10 GB
    free: 5368709120,
    usedPercentage: 50.0,
};
