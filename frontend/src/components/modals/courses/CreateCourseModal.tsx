import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Course, CourseCategory } from "@/types/course";
import { categoryLabels } from "@/types/course";

interface CourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CourseFormData) => void;
    /** If provided, modal enters edit mode with pre-filled data */
    editCourse?: Course | null;
    isLoading?: boolean;
}

export interface CourseFormData {
    name: string;
    description: string;
    category: CourseCategory;
    image: File | null;
    /** When editing, true means image was removed */
    imageRemoved: boolean;
}

const categoryOptions: { value: CourseCategory; label: string }[] = [
    { value: "principal", label: categoryLabels.principal },
    { value: "order_bump", label: categoryLabels.order_bump },
    { value: "upsell", label: categoryLabels.upsell },
    { value: "bonus", label: categoryLabels.bonus },
];

export function CourseModal({
    open,
    onOpenChange,
    onSubmit,
    editCourse,
    isLoading,
}: CourseModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<CourseCategory>("principal");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!editCourse;

    // Pre-fill form when editing
    useEffect(() => {
        if (editCourse) {
            setName(editCourse.name);
            setDescription(editCourse.description);
            setCategory(editCourse.category);
            setPreview(editCourse.image || null);
            setImageFile(null);
            setImageRemoved(false);
        }
    }, [editCourse]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
            setImageRemoved(false);
        }
    }

    function handleRemoveImage() {
        setImageFile(null);
        setPreview(null);
        setImageRemoved(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit({ name, description, category, image: imageFile, imageRemoved });
    }

    function resetForm() {
        setName("");
        setDescription("");
        setCategory("principal");
        setImageFile(null);
        setPreview(null);
        setImageRemoved(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) resetForm();
                onOpenChange(value);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-add-circle-line"} text-primary`} />
                        {isEditing ? "Editar Curso" : "Criar Novo Curso"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Imagem do Curso</Label>
                        <div className="relative">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors overflow-hidden"
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full aspect-video object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="py-6 space-y-2">
                                        <i className="ri-image-add-line text-3xl text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            Clique para selecionar uma imagem
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Recomendado: 16:9 (1280×720)
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Remove image button */}
                            {preview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-6 right-6 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm hover:opacity-90 transition-opacity"
                                >
                                    <i className="ri-close-line" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="course-name" className="text-sm font-medium">
                            Nome do Curso
                        </Label>
                        <Input
                            id="course-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Marketing Digital Avançado"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="course-desc" className="text-sm font-medium">
                            Descrição
                        </Label>
                        <Textarea
                            id="course-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o conteúdo do curso..."
                            rows={3}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Categoria</Label>
                        <Select
                            value={category}
                            onValueChange={(v) => setCategory(v as CourseCategory)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {categoryOptions.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="rounded-lg"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {category === "principal" && "Curso principal da sua plataforma."}
                            {category === "order_bump" && "Oferta adicional no checkout."}
                            {category === "upsell" && "Oferta de upgrade após a compra."}
                            {category === "bonus" && "Material bônus para compradores."}
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand flex-1"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    {isEditing ? "Salvando..." : "Criando..."}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className="ri-check-line" />
                                    {isEditing ? "Salvar Alterações" : "Criar Curso"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
