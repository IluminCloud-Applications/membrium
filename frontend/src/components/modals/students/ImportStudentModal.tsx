import { useState, useMemo, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CourseMultiSelect } from "@/components/students/CourseMultiSelect";
import {
    ModeSelector,
    PasteInput,
    FileInput,
    ImportOptions,
    ImportPreview,
    type InputMode,
} from "./ImportFormParts";
import { parseTextToStudents, parseCSV } from "@/utils/studentParsers";

interface ImportStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableCourses: { id: number; name: string }[];
    onStartImport: (data: ImportData) => void;
}

export interface ImportData {
    students: { name: string; email: string }[];
    courseIds: number[];
    sendEmail: boolean;
    defaultPassword: string;
}

export function ImportStudentModal({
    open,
    onOpenChange,
    availableCourses,
    onStartImport,
}: ImportStudentModalProps) {
    const [mode, setMode] = useState<InputMode>("paste");
    const [pasteText, setPasteText] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileStudents, setFileStudents] = useState<{ name: string; email: string }[]>([]);
    const [hasHeader, setHasHeader] = useState(true);
    const [sendEmail, setSendEmail] = useState(true);
    const [defaultPassword, setDefaultPassword] = useState("senha123");

    // Courses
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [courseToAdd, setCourseToAdd] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unselectedCourses = useMemo(
        () => availableCourses.filter((c) => !selectedCourseIds.includes(c.id)),
        [availableCourses, selectedCourseIds]
    );
    const selectedCourses = useMemo(
        () => availableCourses.filter((c) => selectedCourseIds.includes(c.id)),
        [availableCourses, selectedCourseIds]
    );

    function handleAddCourse() {
        if (!courseToAdd) return;
        const id = Number(courseToAdd);
        if (!selectedCourseIds.includes(id)) setSelectedCourseIds((p) => [...p, id]);
        setCourseToAdd("");
    }

    function handleRemoveCourse(cid: number) {
        setSelectedCourseIds((p) => p.filter((id) => id !== cid));
    }

    /* ---- Parse students ---- */
    const parsedStudents = useMemo(() => {
        if (mode === "file") return fileStudents;
        return parseTextToStudents(pasteText);
    }, [mode, pasteText, fileStudents]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            setFileStudents(parseCSV(content, hasHeader));
        };
        reader.readAsText(file);
    }, [hasHeader]);

    function handleHeaderToggle(checked: boolean) {
        setHasHeader(checked);
        if (fileInputRef.current?.files?.[0]) {
            const file = fileInputRef.current.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result as string;
                setFileStudents(parseCSV(content, checked));
            };
            reader.readAsText(file);
        }
    }

    function handleSubmit() {
        if (parsedStudents.length === 0) return;
        onStartImport({
            students: parsedStudents,
            courseIds: selectedCourseIds,
            sendEmail,
            defaultPassword: defaultPassword.trim() || "senha123",
        });
        resetForm();
    }

    function resetForm() {
        setPasteText("");
        setFileName("");
        setFileStudents([]);
        setSelectedCourseIds([]);
        setCourseToAdd("");
        setHasHeader(true);
        setSendEmail(true);
        setDefaultPassword("senha123");
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-upload-2-line text-primary" />
                        Importar Alunos
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    <ModeSelector mode={mode} onChange={setMode} />

                    {mode === "paste" && <PasteInput value={pasteText} onChange={setPasteText} />}

                    {mode === "file" && (
                        <FileInput
                            fileName={fileName}
                            hasHeader={hasHeader}
                            onHeaderToggle={handleHeaderToggle}
                            onFileChange={handleFileChange}
                            fileInputRef={fileInputRef}
                        />
                    )}

                    <CourseMultiSelect
                        selectedCourses={selectedCourses}
                        unselectedCourses={unselectedCourses}
                        courseToAdd={courseToAdd}
                        onCourseToAddChange={setCourseToAdd}
                        onAdd={handleAddCourse}
                        onRemove={handleRemoveCourse}
                    />

                    <ImportOptions
                        sendEmail={sendEmail}
                        onSendEmailChange={setSendEmail}
                        defaultPassword={defaultPassword}
                        onPasswordChange={setDefaultPassword}
                    />

                    {parsedStudents.length > 0 && <ImportPreview students={parsedStudents} />}

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="btn-brand flex-1"
                            disabled={parsedStudents.length === 0 || selectedCourseIds.length === 0}
                            onClick={handleSubmit}
                        >
                            <i className="ri-upload-2-line mr-1" />
                            Importar {parsedStudents.length} aluno{parsedStudents.length !== 1 ? "s" : ""}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
