import { useState, useEffect, useRef, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShowcaseFormInfo } from "./ShowcaseFormInfo";
import { ShowcaseFormConfig } from "./ShowcaseFormConfig";
import type { ShowcaseItem, ShowcaseCourse } from "@/types/showcase";
import type { CourseGroup } from "@/types/course";

export interface ShowcaseFormData {
    title: string;
    description: string;
    url: string;
    image: File | null;
    courseIds: number[];
    priority: number;
}

interface ShowcaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editItem: ShowcaseItem | null;
    availableCourses: ShowcaseCourse[];
    courseGroups: CourseGroup[];
    onSubmit: (data: ShowcaseFormData) => void;
}

const emptyForm: ShowcaseFormData = {
    title: "",
    description: "",
    url: "",
    image: null,
    courseIds: [],
    priority: 5,
};

export function ShowcaseModal({
    open,
    onOpenChange,
    editItem,
    availableCourses,
    courseGroups,
    onSubmit,
}: ShowcaseModalProps) {
    const [form, setForm] = useState<ShowcaseFormData>(emptyForm);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [groupFilter, setGroupFilter] = useState<string>("all");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!editItem;

    const filteredCourses = useMemo(() => {
        if (groupFilter === "all") return availableCourses;
        const group = courseGroups.find((g) => g.id === Number(groupFilter));
        if (!group) return availableCourses;
        return availableCourses.filter((c) => group.courseIds.includes(c.id));
    }, [availableCourses, courseGroups, groupFilter]);

    useEffect(() => {
        if (editItem) {
            setForm({
                title: editItem.title,
                description: editItem.description,
                url: editItem.url,
                image: null,
                courseIds: editItem.courses.map((c) => c.id),
                priority: editItem.priority,
            });
            setImagePreview(editItem.imageUrl || null);
        } else {
            setForm(emptyForm);
            setImagePreview(null);
        }
        setGroupFilter("all");
    }, [editItem, open]);

    function handleChange(field: keyof ShowcaseFormData, value: string | number) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm((prev) => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleRemoveImage() {
        setForm((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function toggleCourse(courseId: number) {
        setForm((prev) => ({
            ...prev,
            courseIds: prev.courseIds.includes(courseId)
                ? prev.courseIds.filter((id) => id !== courseId)
                : [...prev.courseIds, courseId],
        }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${isEditing ? "ri-pencil-line" : "ri-add-line"} text-primary`} />
                        {isEditing ? "Editar Item" : "Novo Item na Vitrine"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do item da vitrine."
                            : "Preencha os dados para criar um novo item na vitrine."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <ShowcaseFormInfo
                            title={form.title}
                            description={form.description}
                            imagePreview={imagePreview}
                            onTitleChange={(v) => handleChange("title", v)}
                            onDescriptionChange={(v) => handleChange("description", v)}
                            onUploadClick={() => fileInputRef.current?.click()}
                            onRemoveImage={handleRemoveImage}
                        />

                        <ShowcaseFormConfig
                            url={form.url}
                            priority={form.priority}
                            courseIds={form.courseIds}
                            groupFilter={groupFilter}
                            filteredCourses={filteredCourses}
                            courseGroups={courseGroups}
                            onUrlChange={(v) => handleChange("url", v)}
                            onPriorityChange={(v) => handleChange("priority", v)}
                            onToggleCourse={toggleCourse}
                            onGroupFilterChange={setGroupFilter}
                        />
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" className="btn-brand">
                            <i className={`${isEditing ? "ri-save-line" : "ri-add-line"} mr-1`} />
                            {isEditing ? "Salvar Alterações" : "Criar Item"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
