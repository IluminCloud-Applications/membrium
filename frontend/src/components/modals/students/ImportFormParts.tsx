import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

/* ---- Mode selector tabs ---- */

export type InputMode = "paste" | "file";

export function ModeSelector({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) {
    return (
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
                type="button"
                onClick={() => onChange("paste")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "paste" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                <i className="ri-clipboard-line mr-1.5" />
                Colar Emails
            </button>
            <button
                type="button"
                onClick={() => onChange("file")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "file" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                <i className="ri-file-text-line mr-1.5" />
                Arquivo CSV/TXT
            </button>
        </div>
    );
}

/* ---- Paste text input ---- */

export function PasteInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">Lista de alunos</Label>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={"joao@email.com\nmaria@email.com\ncarlos@email.com\n\nOu com Nome e E-mail:\nJoão Silva, joao@email.com\n\nOu com Nome, E-mail e Telefone:\nJoão Silva, joao@email.com, 5511999999999"}
                rows={8}
                className="font-mono text-sm resize-none"
            />
            <div className="bg-muted/40 p-3 rounded-xl border text-xs text-muted-foreground space-y-2">
                <span className="font-semibold text-foreground flex items-center gap-1">
                    <i className="ri-information-line text-primary" />
                    Como organizar os dados de cada linha:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans">
                    <div className="bg-background px-2.5 py-1.5 rounded-lg border flex flex-col gap-0.5">
                        <span className="font-semibold text-[9px] text-primary uppercase tracking-wider">Apenas E-mail</span>
                        <code className="text-foreground text-[10px] truncate">email@exemplo.com</code>
                    </div>
                    <div className="bg-background px-2.5 py-1.5 rounded-lg border flex flex-col gap-0.5">
                        <span className="font-semibold text-[9px] text-primary uppercase tracking-wider">Nome & E-mail</span>
                        <code className="text-foreground text-[10px] truncate">Nome, email@exemplo.com</code>
                    </div>
                    <div className="bg-background px-2.5 py-1.5 rounded-lg border flex flex-col gap-0.5">
                        <span className="font-semibold text-[9px] text-primary uppercase tracking-wider">Completo com Tel.</span>
                        <code className="text-foreground text-[10px] truncate">Nome, email, telefone</code>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground/80 italic">
                    * Você pode separar os campos por vírgula (,), ponto e vírgula (;) ou espaço de tabulação (Tab).
                </p>
            </div>
        </div>
    );
}

/* ---- File upload input ---- */

export function FileInput({
    fileName,
    hasHeader,
    onHeaderToggle,
    onFileChange,
    fileInputRef,
}: {
    fileName: string;
    hasHeader: boolean;
    onHeaderToggle: (c: boolean) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className="space-y-3">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
                <i className="ri-file-upload-line text-3xl text-muted-foreground mb-2 block" />
                {fileName ? (
                    <p className="text-sm font-medium text-primary">{fileName}</p>
                ) : (
                    <>
                        <p className="text-sm font-medium">Clique ou arraste um arquivo</p>
                        <p className="text-xs text-muted-foreground mt-1">CSV ou TXT</p>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={onFileChange}
                    className="hidden"
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="has-header"
                        checked={hasHeader}
                        onCheckedChange={(c) => onHeaderToggle(c === true)}
                    />
                    <Label htmlFor="has-header" className="text-sm cursor-pointer">
                        A primeira linha é cabeçalho
                    </Label>
                </div>

                <a
                    href="https://docs.google.com/spreadsheets/d/1E1o4IjxbFULkem0IClbiyJikJYHPTHUEQ44g-qkeccc/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    <i className="ri-file-download-line text-sm" />
                    Ver CSV de exemplo
                </a>
            </div>
        </div>
    );
}

/* ---- Import options (password, email) ---- */

export function ImportOptions({
    sendEmail,
    onSendEmailChange,
    sendWhatsapp,
    onSendWhatsappChange,
    defaultPassword,
    onPasswordChange,
}: {
    sendEmail: boolean;
    onSendEmailChange: (v: boolean) => void;
    sendWhatsapp: boolean;
    onSendWhatsappChange: (v: boolean) => void;
    defaultPassword: string;
    onPasswordChange: (v: string) => void;
}) {
    return (
        <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Disparos de acesso para novos alunos</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2.5 bg-card border rounded-xl px-4 py-3 flex-1 hover:bg-muted/20 transition-colors">
                        <Checkbox
                            id="send-email"
                            checked={sendEmail}
                            onCheckedChange={(c) => onSendEmailChange(c === true)}
                        />
                        <Label htmlFor="send-email" className="text-sm font-medium cursor-pointer flex items-center gap-2 select-none w-full">
                            <i className="ri-mail-line text-muted-foreground text-base" />
                            Enviar por E-mail
                        </Label>
                    </div>
                    <div className="flex items-center gap-2.5 bg-card border rounded-xl px-4 py-3 flex-1 hover:bg-muted/20 transition-colors">
                        <Checkbox
                            id="send-whatsapp"
                            checked={sendWhatsapp}
                            onCheckedChange={(c) => onSendWhatsappChange(c === true)}
                        />
                        <Label htmlFor="send-whatsapp" className="text-sm font-medium cursor-pointer flex items-center gap-2 select-none w-full">
                            <i className="ri-whatsapp-line text-emerald-600 text-base" />
                            Enviar por WhatsApp
                        </Label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="default-pwd" className="text-sm font-medium">
                    Senha padrão
                </Label>
                <Input
                    id="default-pwd"
                    value={defaultPassword}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="senha123"
                    className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                    Todos os alunos novos importados receberão esta senha inicial.
                </p>
            </div>
        </div>
    );
}

/* ---- Preview of parsed students ---- */

export function ImportPreview({ students }: { students: { name: string; email: string; phone?: string }[] }) {
    const preview = students.slice(0, 5);
    const remaining = students.length - preview.length;

    return (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                    <i className="ri-group-line text-primary" />
                    {students.length} aluno{students.length !== 1 ? "s" : ""} encontrado{students.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="space-y-1">
                {preview.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                            {(s.name || s.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[140px]">
                            {s.name || "—"}
                        </span>
                        <span className="text-muted-foreground truncate max-w-[180px]">
                            {s.email}
                        </span>
                        {s.phone && (
                            <span className="text-emerald-600 dark:text-emerald-500 font-sans text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-0.5 shrink-0 ml-auto">
                                <i className="ri-whatsapp-line text-[11px]" />
                                {s.phone}
                            </span>
                        )}
                    </div>
                ))}
                {remaining > 0 && (
                    <p className="text-xs text-muted-foreground pl-7">
                        e mais {remaining} aluno{remaining !== 1 ? "s" : ""}...
                    </p>
                )}
            </div>
        </div>
    );
}
