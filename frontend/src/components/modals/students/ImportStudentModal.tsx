import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
import { studentsService, type ImportProgress, type ImportResult } from "@/services/students";

interface ImportStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableCourses: { id: number; name: string }[];
    onImportCompleted?: () => void;
}

export interface ImportData {
    students: { name: string; email: string; phone?: string }[];
    courseIds: number[];
    sendEmail: boolean;
    sendWhatsapp: boolean;
    defaultPassword: string;
}

export function ImportStudentModal({
    open,
    onOpenChange,
    availableCourses,
    onImportCompleted,
}: ImportStudentModalProps) {
    const [mode, setMode] = useState<InputMode>("paste");
    const [pasteText, setPasteText] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileStudents, setFileStudents] = useState<{ name: string; email: string; phone?: string }[]>([]);
    const [hasHeader, setHasHeader] = useState(true);
    const [sendEmail, setSendEmail] = useState(true);
    const [sendWhatsapp, setSendWhatsapp] = useState(false);
    const [defaultPassword, setDefaultPassword] = useState("senha123");

    // Progress State
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const isImporting = !!importProgress && !importResult;
    const isFinished = !!importResult;

    // Warn before closing tab if importing
    useEffect(() => {
        if (!isImporting) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "A importação está em andamento. Se você fechar a página, o progresso será perdido.";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isImporting]);

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

        setImportProgress({
            current: 0,
            total: parsedStudents.length,
            imported: 0,
            skipped: 0
        });
        setImportResult(null);

        studentsService.importStudents(
            {
                students: parsedStudents,
                courseIds: selectedCourseIds,
                sendEmail,
                sendWhatsapp,
                defaultPassword: defaultPassword.trim() || "senha123",
            },
            (progress) => {
                setImportProgress(progress);
            },
            (result) => {
                setImportResult(result);
                if (onImportCompleted) {
                    onImportCompleted();
                }
            }
        ).catch(() => {
            setImportProgress(null);
        });
    }

    function resetForm() {
        setPasteText("");
        setFileName("");
        setFileStudents([]);
        setSelectedCourseIds([]);
        setCourseToAdd("");
        setHasHeader(true);
        setSendEmail(true);
        setSendWhatsapp(false);
        setDefaultPassword("senha123");
        setImportProgress(null);
        setImportResult(null);
    }

    return (
        <Dialog 
            open={open} 
            onOpenChange={(o) => { 
                if (isImporting) return;
                if (!o) resetForm(); 
                onOpenChange(o); 
            }}
        >
            <DialogContent 
                className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
                showCloseButton={!isImporting}
                onEscapeKeyDown={(e) => { if (isImporting) e.preventDefault(); }}
                onPointerDownOutside={(e) => { if (isImporting) e.preventDefault(); }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-upload-2-line text-primary" />
                        Importar Alunos
                    </DialogTitle>
                </DialogHeader>

                {isImporting || isFinished ? (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                            {isImporting ? (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <i className="ri-loader-4-line animate-spin text-primary text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Importando Alunos...</h3>
                                    <p className="text-sm text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                        <i className="ri-alert-line" />
                                        Por favor, não feche esta aba ou atualize a página.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-2">
                                        <i className="ri-checkbox-circle-line text-emerald-600 text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-emerald-600">Importação Concluída!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        O processo foi finalizado com sucesso.
                                    </p>
                                </>
                            )}
                        </div>

                        {(() => {
                            const current = isFinished ? importResult!.total : (importProgress?.current ?? 0);
                            const total = isFinished ? importResult!.total : (importProgress?.total ?? 0);
                            const imported = isFinished ? importResult!.imported : (importProgress?.imported ?? 0);
                            const skipped = isFinished ? importResult!.skipped : (importProgress?.skipped ?? 0);
                            const pct = total > 0 ? Math.round((current / total) * 100) : 0;

                            return (
                                <div className="space-y-4 bg-muted/40 p-5 rounded-xl border">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Progresso</span>
                                            <span>{pct}% ({current} de {total})</span>
                                        </div>
                                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${isFinished ? "bg-emerald-500" : "bg-primary"
                                                    }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 text-center font-sans">
                                        <div className="bg-card border rounded-lg p-3">
                                            <span className="block text-2xl font-bold text-emerald-600">{imported}</span>
                                            <span className="text-xs text-muted-foreground font-medium">Importados</span>
                                        </div>
                                        <div className="bg-card border rounded-lg p-3">
                                            <span className="block text-2xl font-bold text-amber-500">{skipped}</span>
                                            <span className="text-xs text-muted-foreground font-medium">Existentes / Vinculados</span>
                                        </div>
                                    </div>

                                    {isFinished && importResult!.errors && importResult!.errors.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <span className="text-sm font-semibold text-destructive flex items-center gap-1">
                                                <i className="ri-error-warning-line" />
                                                Erros / Alertas ({importResult!.errors.length})
                                            </span>
                                            <div className="max-h-36 overflow-y-auto border border-destructive/20 bg-destructive/5 rounded-lg p-3 text-xs text-destructive space-y-1">
                                                {importResult!.errors.map((err, idx) => (
                                                    <div key={idx} className="flex gap-1">
                                                        <span className="font-semibold">•</span>
                                                        <span>{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {isFinished && (
                            <div className="flex pt-2">
                                <Button 
                                    className="w-full btn-brand" 
                                    onClick={() => {
                                        resetForm();
                                        onOpenChange(false);
                                    }}
                                >
                                    Concluir e Fechar
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
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
                            sendWhatsapp={sendWhatsapp}
                            onSendWhatsappChange={setSendWhatsapp}
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
                )}
            </DialogContent>
        </Dialog>
    );
}
