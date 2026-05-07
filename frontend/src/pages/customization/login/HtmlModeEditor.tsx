/**
 * HtmlModeEditor — editor de código para o modo HTML da página de login.
 *
 * Contém:
 *  - Tabs: HTML | CSS | JS
 *  - Badge das APIs necessárias (login + forgot-password)
 *  - Prompt de IA pré-pronto para copiar e colar
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";

interface HtmlModeEditorProps {
    html: string;
    css: string;
    js: string;
    onChangeHtml: (v: string) => void;
    onChangeCss: (v: string) => void;
    onChangeJs: (v: string) => void;
}

type Tab = "html" | "css" | "js";

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "html", label: "HTML", icon: "ri-html5-line" },
    { id: "css",  label: "CSS",  icon: "ri-css3-line"  },
    { id: "js",   label: "JS",   icon: "ri-javascript-line" },
];

const API_BADGES = [
    { method: "POST", path: "/api/auth/login",           body: '{ "email": "...", "password": "..." }' },
    { method: "POST", path: "/api/auth/forgot-password", body: '{ "email": "..." }' },
];

const AI_PROMPT = `Modifique o código da página de login para integrar as APIs da plataforma Membrium:

No formulário de login, adicione id="login-form" no <form>, name="email" e name="password" nos campos, e required em ambos. O form deve fazer POST em /api/auth/login com body JSON { email, password }.

No formulário de esqueci minha senha (crie um se não existir), adicione id="forgot-form" no <form> e name="email" no campo, com required. O form deve fazer POST em /api/auth/forgot-password com body JSON { email }.

Não adicione fetch/XHR — o sistema injeta o script de integração automaticamente.

Se o código não estiver separado em HTML, CSS e JS, separe em 3 arquivos distintos.`;

export function HtmlModeEditor({
    html, css, js,
    onChangeHtml, onChangeCss, onChangeJs,
}: HtmlModeEditorProps) {
    const [activeTab, setActiveTab] = useState<Tab>("html");
    const [copied, setCopied] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    function handleCopy() {
        const full = AI_PROMPT + "\n\n```html\n" + html + "\n```\n\n```css\n" + css + "\n```\n\n```js\n" + js + "\n```";
        navigator.clipboard.writeText(full).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const value    = activeTab === "html" ? html : activeTab === "css" ? css : js;
    const onChange = activeTab === "html" ? onChangeHtml : activeTab === "css" ? onChangeCss : onChangeJs;
    const placeholder = activeTab === "html"
        ? `<section class="login-hero">\n  <form id="login-form">\n    <input name="email" type="email" required />\n    <input name="password" type="password" required />\n    <button type="submit">Entrar</button>\n  </form>\n</section>`
        : activeTab === "css"
        ? `body { margin: 0; font-family: sans-serif; }\n.login-hero { ... }`
        : `// JS opcional — não precisa lidar com fetch, o sistema cuida disso.`;

    return (
        <div className="space-y-4">

            {/* ── API badges ──────────────────────────────── */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                    <i className="ri-plug-line text-sm" />
                    APIs integradas automaticamente
                </Label>
                <div className="flex flex-wrap gap-2">
                    {API_BADGES.map((b) => (
                        <span key={b.path} className="html-api-badge" title={`Body: ${b.body}`}>
                            <span className="opacity-60">{b.method}</span>
                            {b.path}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Adicione <code className="bg-muted px-1 py-0.5 rounded text-[11px]">id="login-form"</code> e{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-[11px]">id="forgot-form"</code> nos seus formulários.
                    O sistema injeta o script de integração automaticamente.
                </p>
            </div>

            {/* ── Code editor tabs ─────────────────────────── */}
            <div className="space-y-2">
                <div className="flex items-center gap-1 border-b border-border pb-0">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={[
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md border border-b-0 -mb-px transition-colors",
                                activeTab === t.id
                                    ? "border-border bg-background text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground",
                            ].join(" ")}
                        >
                            <i className={t.icon} />
                            {t.label}
                        </button>
                    ))}
                </div>
                <textarea
                    className="html-editor-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                />
            </div>

            {/* ── AI Prompt ───────────────────────────────── */}
            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => setShowPrompt((p) => !p)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <i className={showPrompt ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"} />
                    <i className="ri-sparkling-2-line" />
                    Prompt de IA — configure suas APIs automaticamente
                </button>

                {showPrompt && (
                    <div className="html-prompt-box">
                        <button
                            type="button"
                            className="html-prompt-copy-btn"
                            onClick={handleCopy}
                        >
                            <i className={copied ? "ri-check-line" : "ri-clipboard-line"} />
                            {copied ? "Copiado!" : "Copiar"}
                        </button>
                        {AI_PROMPT}
                        {"\n\n[seu HTML/CSS/JS será anexado automaticamente ao copiar]"}
                    </div>
                )}

                {showPrompt && (
                    <p className="text-xs text-muted-foreground">
                        Cole este prompt no ChatGPT, Claude ou Gemini junto com seu código.
                        A IA vai adicionar os atributos corretos e o formulário de esqueci a senha.
                        Depois, cole o resultado de volta nos campos acima.
                    </p>
                )}
            </div>
        </div>
    );
}
