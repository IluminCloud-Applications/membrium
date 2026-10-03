import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LoginAiPromptProps {
    css: string;
}

type PromptKey = "create" | "adapt" | "tweak";

interface PromptConfig {
    label: string;
    icon: string;
    inputLabel: string;
    inputPlaceholder: string;
    examples: string[];
    rows: number;
    build: (input: string, css: string) => string;
}

// ─── Prompt builders ──────────────────────────────────────────────

function buildCreatePrompt(input: string): string {
    const style = input.trim() || "[DESCREVA SEU ESTILO]";
    return [
        "# Contexto",
        "Você está ajudando a personalizar visualmente a página de login de uma plataforma de cursos online chamada Membrium.",
        "A página de login já existe e funciona — é uma aplicação React com suporte a layouts clássico (card centralizado com fundo) e moderno (split screen lateral com formulário e imagem).",
        "Seu trabalho é APENAS criar um arquivo CSS que será injetado como <style> global na página de login.",
        "Não crie HTML, não crie JavaScript, não altere a estrutura — apenas CSS puro para sobrescrever os estilos visuais das classes existentes.",
        "",
        "# Estilo desejado",
        style,
        "",
        "# Estrutura da página de login",
        "A página possui dois modos de layout:",
        "1. LAYOUT SIMPLES (Padrão) — container em tela cheia (.auth-layout) com um card central (.auth-card / .login-card) contendo o nome/logo da plataforma (.platform-name), subtítulo (.login-subtitle), formulário e links.",
        "2. LAYOUT MODERNO — layout split screen (duas colunas no desktop, .auth-modern-form à esquerda com o formulário, e imagem à direita). No mobile, comporta-se em coluna única centralizada.",
        "",
        "# Classes CSS disponíveis para customizar",
        "",
        "## Layout global e Containers",
        "- .auth-layout            → wrapper geral de tela cheia no layout simples (fundo da página)",
        "- .auth-card              → container central animado que envolve o card no layout simples",
        "- .login-card             → o card visual do login (background, border-radius, bordas, sombras, blur)",
        "- .auth-modern-form       → painel do formulário no layout moderno (split-screen)",
        "",
        "## Identidade e Textos",
        "- .platform-name          → nome da plataforma ou título principal ('Bem-vindo')",
        "- .login-subtitle         → subtítulo explicativo abaixo do nome ('Faça login para acessar...')",
        "- img[alt='Logo']         → imagem de logo da plataforma (quando presente)",
        "",
        "## Formulário de Login",
        "- form                    → container <form> do formulário",
        "- .form-group             → grupo de cada campo (label + input)",
        "- .form-label             → rótulo dos campos ('E-mail', 'Senha')",
        "- .input-with-icon        → container do input que abriga o ícone",
        "- .input-icon             → ícone posicionado dentro do campo (ri-mail-line, etc.)",
        "- input#login-email       → campo de e-mail (ou inputs gerais de texto)",
        "- input#login-password    → campo de senha",
        "- .auth-link              → link 'Esqueceu a senha?'",
        "- .form-alert             → banner de mensagem de erro ou feedback",
        "",
        "## Botões e Interações",
        "- .btn-brand              → botão principal de ação ('Entrar')",
        "- .btn-brand:hover        → estado hover do botão principal",
        "- .btn-brand:disabled     → estado desabilitado / carregando",
        "",
        "## Acesso Rápido e Etapas Alternativas (se ativos)",
        "- button[variant='outline'] → botões secundários (ex: 'Entrar com Senha')",
        "- button.text-primary     → links secundários ('Alterar e-mail', 'Voltar')",
        "",
        "# Regras obrigatórias",
        "- Escreva apenas CSS puro — sem HTML, sem JavaScript",
        "- Use @import do Google Fonts no topo do arquivo se precisar de fontes temáticas (ex: fontes medievais, góticas, sci-fi, anime, serifadas elegantes)",
        "- Prefira variáveis CSS (:root { --... }) para paleta de cores e propriedades comuns",
        "- Não use !important desnecessariamente, apenas quando preciso para sobrepor estilos padrão",
        "- Não remova propriedades estruturais críticas (como display flex/grid de containers)",
        "- O resultado será colado diretamente no campo de CSS Personalizado — retorne APENAS o CSS, sem explicações, sem blocos markdown",
        "",
        "# Cuidados para evitar bugs e incompatibilidades",
        "- SEMPRE escope os seletores dentro de .auth-layout, .auth-card, .login-card ou .auth-modern-form — NUNCA use seletores genéricos (como body, h1, input, button) sem escopo",
        "- Não use o seletor universal (*) sem escopo",
        "- Garanta contraste legível: o texto digitado nos inputs e os labels precisam ser legíveis",
        "- Ao usar @keyframes, prefixe o nome da animação com 'custom-login-' para evitar colisões",
        "- Garanta que o layout continue responsivo em celulares (max-width: 100%, sem overflow horizontal)",
        "",
        "# Saída esperada",
        "Um arquivo CSS completo, criativo e funcional, pronto para colar, que transforma visualmente a página de login no estilo solicitado mantendo a usabilidade intacta.",
    ].join("\n");
}

function buildAdaptPrompt(input: string, css: string): string {
    const obs = input.trim() || "Mantenha a identidade visual original (cores, tipografia, estilo) da forma mais fiel possível.";
    const currentCss = css.trim() || "[COLE SEU CSS NO CAMPO ACIMA ANTES DE COPIAR ESTE PROMPT]";
    return [
        "# Contexto",
        "Você está ajudando a personalizar a página de login de uma plataforma de cursos online chamada Membrium.",
        "Tenho um CSS existente (por exemplo, criado para a área de membros, uma landing page ou outro tema) e preciso adaptá-lo para aplicar a mesma identidade visual na página de login.",
        "A página de login é uma aplicação React existente — o CSS será injetado como <style> global.",
        "Não crie HTML nem JavaScript — apenas CSS puro.",
        "",
        "# O que preservar",
        obs,
        "",
        "# O que fazer",
        "Adapte o CSS fornecido para que as cores, fontes, bordas, sombras e estilos visuais sejam aplicados corretamente nas classes da página de login.",
        "Mapeie os estilos existentes para as classes de login listadas abaixo.",
        "",
        "# Classes da página de login para aplicar os estilos",
        "- .auth-layout            → wrapper geral de tela cheia (fundo da página)",
        "- .login-card             → card central de login (fundo, bordas, sombra, blur)",
        "- .auth-card              → container do card central",
        "- .auth-modern-form       → painel do formulário no layout moderno",
        "- .platform-name          → título principal / nome da plataforma",
        "- .login-subtitle         → subtítulo da página de login",
        "- input#login-email       → campo de e-mail",
        "- input#login-password    → campo de senha",
        "- .form-label             → rótulos dos campos",
        "- .auth-link              → link 'Esqueceu a senha?'",
        "- .btn-brand              → botão principal 'Entrar'",
        "- .btn-brand:hover        → hover do botão principal",
        "",
        "# Regras e cuidados para evitar bugs",
        "- Retorne apenas o CSS adaptado, sem explicações, sem markdown",
        "- Não remova propriedades estruturais funcionais",
        "- Mantenha fontes externas via @import do Google Fonts se o CSS original as utilizar",
        "- Sempre escope os seletores nas classes de login (.auth-layout, .login-card, .auth-modern-form, etc.)",
        "- Prefixe @keyframes com 'custom-login-' para evitar colisões",
        "",
        "# Meu CSS original (para adaptar)",
        currentCss,
        "",
        "# Saída esperada",
        "CSS completo e pronto para colar, com a identidade visual adaptada para as classes da página de login.",
    ].join("\n");
}

function buildTweakPrompt(input: string, css: string): string {
    const what = input.trim() || "[DESCREVA O QUE QUER MUDAR]";
    const currentCss = css.trim() || "[COLE SEU CSS NO CAMPO ACIMA ANTES DE COPIAR ESTE PROMPT]";
    return [
        "# Contexto",
        "Você está ajudando a ajustar o CSS da página de login de uma plataforma de cursos online chamada Membrium.",
        "A página de login é uma aplicação React existente — o CSS é injetado como <style> global.",
        "Tenho um CSS de login já funcionando e quero fazer ajustes pontuais sem quebrar o restante da página.",
        "",
        "# Ajuste solicitado",
        what,
        "",
        "# Regras e cuidados para evitar bugs",
        "- Faça APENAS os ajustes pedidos — não altere o que não foi solicitado",
        "- Não remova propriedades estruturais essenciais",
        "- Não use !important desnecessariamente",
        "- Retorne o CSS completo com os ajustes já aplicados — sem explicações, sem markdown",
        "- Mantenha todos os seletores escopados em .auth-layout, .login-card, .auth-modern-form ou nas classes de login",
        "- Garanta contraste legível entre textos e fundos",
        "- Se o ajuste usar @keyframes, prefixe com 'custom-login-'",
        "",
        "# CSS atual (para ajustar)",
        currentCss,
        "",
        "# Saída esperada",
        "O CSS completo (com os ajustes já aplicados), pronto para colar diretamente no campo de personalização da página de login.",
    ].join("\n");
}

// ─── Config ───────────────────────────────────────────────────────

const PROMPTS: Record<PromptKey, PromptConfig> = {
    create: {
        label: "Criar do zero",
        icon: "ri-magic-line",
        inputLabel: "Descreva o estilo desejado",
        inputPlaceholder: "Ex: quero um design similar a piratas do caribe, tema de madeira e piratas...",
        rows: 3,
        examples: [
            "tema Piratas do Caribe com fundo de madeira rústica, detalhes em dourado envelhecido e pergaminho",
            "tema anime similar a Naruto com detalhes em laranja e preto, nuvens sutis e traços marcantes",
            "dark minimalista com bordas neon e efeito glassmorphism fosco",
            "futurista cyberpunk com tons de roxo escuro, azul ciano e brilho neon",
            "elegante estilo Apple com fundo claro, tipografia limpa e sombras suaves",
            "tema de luxo com preto profundo, dourado metálico e cantos sofisticados",
        ],
        build: (input) => buildCreatePrompt(input),
    },
    adapt: {
        label: "Adaptar tema",
        icon: "ri-swap-line",
        inputLabel: "O que quer preservar da identidade visual?",
        inputPlaceholder: "Ex: manter as cores roxo e dourado da área de membros e aplicar no login...",
        rows: 3,
        examples: [
            "manter a mesma paleta de cores e tipografia da minha área de membros",
            "adaptar mantendo o estilo minimalista dark com bordas neon",
            "usar as cores da marca (azul marinho #0a2342 e dourado #d4a017) no card e no botão",
            "preservar o efeito de vidro fosco (glassmorphism) da área de membros",
        ],
        build: (input, css) => buildAdaptPrompt(input, css),
    },
    tweak: {
        label: "Ajuste fino",
        icon: "ri-edit-line",
        inputLabel: "O que quer ajustar no tema atual?",
        inputPlaceholder: "Ex: deixar o card de login com efeito de vidro e o botão com glow...",
        rows: 3,
        examples: [
            "adicionar efeito glassmorphism (backdrop-filter: blur) no card de login",
            "mudar o botão 'Entrar' para ter bordas arredondadas e sombra brilhante (glow)",
            "alterar os inputs para terem fundo transparente com borda fina iluminada ao focar",
            "adicionar um efeito suave de gradiente animado no fundo",
            "aumentar o tamanho do título e trocar para uma fonte moderna do Google Fonts",
            "deixar o card mais compacto com cantos mais arredondados (border-radius: 1.5rem)",
        ],
        build: (input, css) => buildTweakPrompt(input, css),
    },
};

// ─── Component ────────────────────────────────────────────────────

export function LoginAiPrompt({ css }: LoginAiPromptProps) {
    const [activePrompt, setActivePrompt] = useState<PromptKey>("create");
    const [inputs, setInputs] = useState<Record<PromptKey, string>>({
        create: "",
        adapt: "",
        tweak: "",
    });
    const [copied, setCopied] = useState(false);

    const config = PROMPTS[activePrompt];
    const currentInput = inputs[activePrompt];

    function setInput(value: string) {
        setInputs((prev) => ({ ...prev, [activePrompt]: value }));
    }

    function handleCopy() {
        const text = config.build(currentInput, css);
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function applyExample(example: string) {
        setInput(example);
    }

    return (
        <TooltipProvider delayDuration={200}>
            <details className="group border border-border/60 rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors select-none list-none">
                    <span className="flex items-center gap-2">
                        <i className="ri-robot-2-line text-primary/70" />
                        Gerar com IA
                    </span>
                    <i className="ri-arrow-down-s-line transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-3 space-y-3 bg-background">
                    {/* Prompt type tabs */}
                    <div className="flex gap-1 bg-muted/60 rounded-lg p-1">
                        {(Object.entries(PROMPTS) as [PromptKey, PromptConfig][]).map(([key, p]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => { setActivePrompt(key); setCopied(false); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all",
                                    activePrompt === key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <i className={p.icon} />
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Label + tooltip */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                {config.inputLabel}
                            </label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                    >
                                        <i className="ri-lightbulb-line text-xs" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    align="start"
                                    className="max-w-[280px] p-3 space-y-2 bg-popover text-popover-foreground border border-border shadow-lg"
                                >
                                    <p className="text-xs font-semibold text-foreground mb-1.5">
                                        💡 Exemplos de descrição
                                    </p>
                                    <ul className="space-y-1.5">
                                        {config.examples.map((ex) => (
                                            <li key={ex}>
                                                <button
                                                    type="button"
                                                    onClick={() => applyExample(ex)}
                                                    className="text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 w-full px-2 py-1 rounded transition-colors"
                                                >
                                                    "{ex}"
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/40">
                                        Clique em um exemplo para preencher
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <Textarea
                            value={currentInput}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={config.inputPlaceholder}
                            rows={config.rows}
                            className="text-sm resize-none"
                        />
                    </div>

                    {/* Copy button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className={cn(
                            "w-full gap-2 transition-all",
                            copied && "border-green-500 text-green-500"
                        )}
                    >
                        <i className={copied ? "ri-check-line" : "ri-clipboard-line"} />
                        {copied ? "Prompt copiado!" : "Copiar prompt completo"}
                    </Button>
                </div>
            </details>
        </TooltipProvider>
    );
}
