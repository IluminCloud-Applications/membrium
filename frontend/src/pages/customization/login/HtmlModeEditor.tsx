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
    { method: "POST", path: "/api/auth/login",            body: '{ "email": "...", "password": "..." }' },
    { method: "POST", path: "/api/auth/forgot-password",  body: '{ "email": "..." }' },
    { method: "POST", path: "/api/auth/quick-access/send", body: '{ "email": "..." }' },
];

const AI_PROMPT = `Sua tarefa é criar uma página de login personalizada para uma plataforma de área de membros chamada Membrium. Mas antes de criar, você DEVE fazer apenas UMA pergunta e aguardar minha resposta:

Pergunta que você deve fazer agora:
"Qual é o tema visual da sua área de membros? Por exemplo: Piratas do Caribe, Espaço sideral, Natureza zen, Minimalista moderno, Cyberpunk, etc. Descreva também se prefere tema claro ou escuro, e se quiser, mencione alguma cor predominante."

Depois que eu responder com o tema, você vai criar a página de login completa em 3 blocos separados (HTML, CSS e JS), seguindo obrigatoriamente todas as regras técnicas abaixo. Não gere nada ainda — apenas faça a pergunta acima e aguarde.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 SOBRE O DESIGN (aplicar após receber o tema)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Crie um design visualmente impressionante e temático, condizente com o tema informado.
- Use fontes do Google Fonts (importe via @import no CSS) adequadas ao tema.
- Utilize gradientes, texturas, ícones Unicode/emoji ou SVG inline para enriquecer o visual.
- A página deve ocupar 100% da viewport (min-height: 100vh) e ser totalmente responsiva.
- Crie um card de login centralizado com sombra, bordas arredondadas e boa legibilidade.
- O design deve parecer premium — evite layouts genéricos ou sem personalidade.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REGRAS TÉCNICAS OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A plataforma injeta automaticamente um script "bridge" na página que intercepta formulários
e botões com atributos especiais. NUNCA adicione fetch, XHR ou axios — o bridge cuida de tudo.

- Separe o código em exatamente 3 blocos: HTML, CSS e JS.
- Não use <script> com fetch/XHR/axios. O bridge é injetado automaticamente.
- Não importe bibliotecas JS externas. Apenas Google Fonts via @import no CSS é permitido.
- Todo estilo deve estar no bloco CSS. Sem style="" inline nos elementos HTML.
- Toda lógica de transição entre os passos deve estar no bloco JS com vanilla JS puro.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FLUXO DE LOGIN — LEIA COM ATENÇÃO (este é o ponto mais importante)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O login segue um fluxo de múltiplos passos, NÃO um formulário único com todos os campos visíveis.
O fluxo muda dinamicamente dependendo se a plataforma tem integração de mensagens configurada.

O bridge detecta isso automaticamente ao carregar a página via GET /api/auth/quick-access/status.
O resultado fica disponível no JS como: window.MEMBRIUM_STATUS = { available: true/false }

─────────────────────────────────
PASSO 1 — Apenas o campo de e-mail (sempre visível, independente de integração)
─────────────────────────────────
O usuário vê somente um campo de e-mail e um botão "Continuar".
Não mostre campo de senha neste passo.

HTML necessário:
  <div id="step-email">
    <input id="email-input" type="email" placeholder="Seu e-mail" required />
    <button type="button" id="btn-continuar">Continuar</button>
    <p data-membrium-msg="step-email"></p>
  </div>

JS necessário (ao clicar em "Continuar"):
  - Valide se o e-mail está preenchido (mostre erro se não estiver).
  - Copie o valor do e-mail para todos os campos name="email" do DOM.
  - Oculte #step-email e exiba o próximo passo conforme a regra abaixo.

─────────────────────────────────
PASSO 2A — Se houver integração configurada: mostrar as OPÇÕES
─────────────────────────────────
Exibe o e-mail do usuário (somente leitura, como confirmação) e dois botões:
  1. "⚡ Receber Acesso Rápido" → envia link por e-mail ou WhatsApp (sem precisar de senha)
  2. "🔒 Entrar com Senha"     → vai para o Passo 3 (campo de senha)

HTML necessário:
  <div id="step-options" class="hidden">
    <p id="email-display"></p>
    <button type="button" data-membrium="quick-access">⚡ Receber Acesso Rápido</button>
    <button type="button" id="btn-usar-senha">🔒 Entrar com Senha</button>
    <button type="button" id="btn-voltar-email">← Alterar e-mail</button>
    <p data-membrium-msg="step-options"></p>
  </div>

O botão data-membrium="quick-access" é interceptado pelo bridge automaticamente.
Quando clicado, o bridge lê o campo name="email" do DOM e chama POST /api/auth/quick-access/send.
Não adicione nenhuma lógica de clique neste botão — o bridge faz tudo.

─────────────────────────────────
PASSO 2B — Se NÃO houver integração configurada: ir direto para a senha
─────────────────────────────────
Neste caso, não exiba o Passo 2A. Vá direto para o Passo 3.
O botão data-membrium="quick-access" deve existir no HTML mas com class="hidden".
O bridge nunca o exibirá se não houver integração.

─────────────────────────────────
PASSO 3 — Campo de senha (formulário de autenticação)
─────────────────────────────────
Exibe o e-mail (somente leitura) e o campo de senha para o usuário confirmar.

HTML necessário (este é o único <form> que o bridge precisa interceptar):
  <form id="login-form" class="hidden">
    <p id="email-display-senha"></p>
    <input type="hidden" name="email" id="email-hidden" />
    <input type="password" name="password" placeholder="Sua senha" required />
    <button type="submit">Entrar</button>
    <button type="button" id="btn-voltar-opcoes">← Voltar</button>
    <p data-membrium-msg="1"></p>
  </form>

IMPORTANTE: O campo name="email" DEVE estar dentro do <form id="login-form">, mas pode ser hidden.
O bridge lê form.querySelector('[name=email]').value para montar a requisição.
O campo de senha deve ser visível. O e-mail já foi capturado no Passo 1.

─────────────────────────────────
JS COMPLETO DE TRANSIÇÃO ENTRE PASSOS
─────────────────────────────────
Escreva no bloco JS toda a lógica de navegação entre os passos.
Use window.addEventListener('load', function() { ... }) para iniciar após o bridge carregar.

Lógica esperada:
  1. Ao clicar em "Continuar":
     - Valida e-mail preenchido.
     - Copia o e-mail para #email-display, #email-display-senha e #email-hidden.
     - Se window.MEMBRIUM_STATUS.available === true  → mostra #step-options.
     - Se window.MEMBRIUM_STATUS.available === false → mostra #login-form diretamente.
     - Oculta #step-email.

  2. Ao clicar em "Entrar com Senha" (#btn-usar-senha):
     - Oculta #step-options.
     - Exibe #login-form.

  3. Ao clicar em "← Voltar" (#btn-voltar-opcoes):
     - Oculta #login-form.
     - Exibe #step-options (se available) ou #step-email (se não available).

  4. Ao clicar em "← Alterar e-mail" (#btn-voltar-email):
     - Oculta #step-options.
     - Exibe #step-email.

ATENÇÃO: window.MEMBRIUM_STATUS é definido pelo bridge ao carregar a página.
Se não estiver disponível ainda (corrida de carregamento), considere available = false como fallback.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 "ESQUECI MINHA SENHA" (opcional mas recomendado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Crie um link "Esqueceu a senha?" dentro do Passo 3 (#login-form).
Ao clicar, exibe um formulário separado (pode estar oculto por padrão):

  <form id="forgot-form" class="hidden">
    <input name="email" type="email" placeholder="Seu e-mail" required />
    <button type="submit">Enviar link de recuperação</button>
    <button type="button" id="btn-cancelar-forgot">Cancelar</button>
    <p data-membrium-msg="1"></p>
  </form>

O bridge intercepta o submit de id="forgot-form" e chama POST /api/auth/forgot-password com { email }.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST FINAL ANTES DE ENTREGAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Passo 1: #step-email visível com input type="email" e botão "Continuar"
[ ] Passo 2: #step-options oculto com botão data-membrium="quick-access" e botão #btn-usar-senha
[ ] Passo 3: <form id="login-form"> oculto com name="email" (hidden), name="password" e type="submit"
[ ] JS: lógica completa de transição entre passos usando window.MEMBRIUM_STATUS.available
[ ] JS: cópia do e-mail do Passo 1 para #email-hidden, #email-display e #email-display-senha
[ ] Nenhum fetch/XHR/axios no código
[ ] Código separado em 3 blocos: HTML | CSS | JS
[ ] Design temático, responsivo e visualmente impressionante
[ ] Classe .hidden no CSS: .hidden { display: none !important; }

Lembre-se: NÃO gere nada agora. Apenas faça a pergunta sobre o tema e aguarde minha resposta.`;

export function HtmlModeEditor({
    html, css, js,
    onChangeHtml, onChangeCss, onChangeJs,
}: HtmlModeEditorProps) {
    const [activeTab, setActiveTab] = useState<Tab>("html");
    const [copied, setCopied] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(AI_PROMPT).then(() => {
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
                    Para o <strong>Acesso Rápido</strong> sem senha, adicione{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-[11px]">data-membrium="quick-access"</code>{" "}
                    em qualquer botão — ele é ativado automaticamente quando há integrações configuradas.
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
