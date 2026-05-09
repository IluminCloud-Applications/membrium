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

interface MemberAiPromptProps {
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
        "Você está ajudando a personalizar visualmente a área de membros de uma plataforma de cursos online chamada Membrium.",
        "A área de membros já existe e funciona — é uma aplicação React com header, banner do curso, carrossel de módulos, player de aula e sidebar de aulas.",
        "Seu trabalho é APENAS criar um arquivo CSS que será injetado como <style> global nas páginas da área de membros.",
        "Não crie HTML, não crie JavaScript, não altere a estrutura — apenas CSS puro para sobrescrever os estilos visuais das classes existentes.",
        "",
        "# Estilo desejado",
        style,
        "",
        "# Estrutura da área de membros",
        "A área possui duas páginas principais:",
        "1. HOME — exibe o header, um banner do curso, carrossel de cards de módulos e rodapé",
        "2. PLAYER DE AULA — exibe header, breadcrumb, player de vídeo, título, botões prev/next/concluir e sidebar com lista de aulas",
        "",
        "# Classes CSS disponíveis para customizar",
        "",
        "## Layout global",
        "- .member-page           → wrapper geral de toda a área (home + lesson)",
        "- .member-main           → container <main> da home",
        "- .member-footer         → rodapé",
        "",
        "## Header / Navegação",
        "- .member-header         → barra de navegação superior (sticky)",
        "- .member-header-scrolled → estado do header após o usuário rolar a página",
        "- .member-logo           → nome ou logo da plataforma no header (usa background-clip:text por padrão; para cor sólida, resete com background:none; -webkit-text-fill-color:SUA_COR)",
        "- .member-nav-link       → links de menu no header",
        "- .member-icon-btn       → botões de ícone no header (notificações, etc.)",
        "- .member-avatar         → avatar circular do usuário logado",
        "- .member-avatar-btn     → botão wrapper do avatar",
        "- .member-dropdown       → menu dropdown que abre ao clicar no avatar",
        "- .member-dropdown-header → cabeçalho do dropdown com nome do aluno",
        "- .member-dropdown-name  → nome do aluno dentro do dropdown",
        "- .member-dropdown-item  → item do menu dropdown (Perfil, Sair)",
        "- .member-dropdown-divider → divisor horizontal do dropdown",
        "",
        "## Banner do curso (Home)",
        "- .member-banner         → container do banner de imagem do curso",
        "- .member-banner-overlay → overlay (gradiente/escurecimento) sobre o banner",
        "",
        "## Seção de cursos / módulos (Home)",
        "- .member-course-section → seção de um curso (pode haver múltiplos)",
        "- .member-course-title   → título do curso",
        "- .member-course-title-primary → título do curso principal (maior)",
        "- .member-course-description → descrição do curso",
        "- .member-course-badge   → badge de status do curso (Bônus, Adicional, etc.)",
        "- .member-course-nav-btn → botões de seta do carrossel de módulos",
        "- .member-carousel       → container do carrossel horizontal de módulos",
        "- .member-module-card    → card de cada módulo (thumbnail + título + progresso)",
        "- .member-module-card:hover → estado hover do card",
        "- .member-module-image-wrap → wrapper da imagem do módulo (contém a imagem, play, progresso)",
        "- .member-module-image   → imagem do módulo",
        "- .member-module-play-overlay → overlay com ícone de play que aparece no hover do card",
        "- .member-module-play-overlay i → o ícone de play em si (botão circular)",
        "- .member-module-name    → título/nome do módulo dentro do card",
        "- .member-module-meta    → informações (qtd aulas, % progresso)",
        "- .member-module-progress-bar → container da barra de progresso do módulo",
        "- .member-module-progress-fill → preenchimento da barra de progresso (cor personalizável)",
        "- .member-module-completed-badge → badge verde de módulo concluído",
        "- .member-module-lock-badge → badge de cadeado para módulos bloqueados",
        "",
        "## Seleção de grupo / Trilhas",
        "- .group-selector-title  → título da tela de seleção de trilha",
        "- .group-selector-subtitle → subtítulo",
        "- .group-selector-card   → card de cada trilha/grupo",
        "- .group-selector-card-name → nome da trilha no card",
        "- .group-selector-card-meta → meta info da trilha",
        "- .grouped-course-row-title → título de cada curso dentro de uma trilha",
        "- .grouped-course-locked-badge → badge de curso bloqueado na trilha",
        "",
        "## Mobile Bottom Nav (visível apenas ≤768px)",
        "- .member-bottom-nav     → barra flutuante inferior do mobile",
        "- .member-bottom-nav-item → cada botão da barra (Início, Buscar, Perfil, etc.)",
        "- .member-bottom-nav-active → item ativo da barra",
        "",
        "## Search Modal",
        "- .member-search-overlay → fundo escuro do modal de busca",
        "- .member-search-modal   → container do modal",
        "- .member-search-input   → campo de texto da busca",
        "- .member-search-icon    → ícone de busca",
        "- .member-search-result  → item de resultado da busca",
        "- .member-search-result-title → título do resultado",
        "- .member-search-result-meta → meta info do resultado",
        "",
        "## Perfil do aluno",
        "- .member-profile-avatar-small → avatar na página de perfil",
        "- .member-profile-title  → nome do aluno no cabeçalho do perfil",
        "- .member-profile-email  → email do aluno",
        "- .member-profile-card   → cards de formulário do perfil (dados pessoais, senha)",
        "- .member-profile-card-title → título de cada card (com ícone)",
        "- .member-profile-label  → labels dos campos de formulário",
        "- .member-profile-input  → inputs do formulário",
        "- .member-profile-btn    → botão de salvar no perfil",
        "- .member-profile-message-success → mensagem de sucesso",
        "- .member-profile-message-error → mensagem de erro",
        "- .member-support-channel → card de canal de suporte (email, whatsapp)",
        "",
        "## Player de aula (Lesson)",
        "- .lesson-breadcrumb-bar → barra de navegação/breadcrumb no topo",
        "- .lesson-breadcrumb-link → link '← Voltar para Cursos'",
        "- .lesson-page-layout    → grid principal que divide vídeo e sidebar",
        "- .lesson-main-col       → coluna principal com vídeo, título e conteúdo",
        "- .lesson-video-container → container do player de vídeo",
        "- .lesson-title-section  → área do título da aula",
        "- .lesson-title          → título da aula atual",
        "- .lesson-sidebar        → sidebar direita com lista de aulas do módulo",
        "- .lesson-sidebar-header → cabeçalho da sidebar",
        "- .lesson-sidebar-item   → item de aula na sidebar",
        "- .lesson-sidebar-item-active → aula ativa na sidebar",
        "- .lesson-sidebar-item-icon → ícone circular (play/número/check) na sidebar",
        "- .lesson-sidebar-item-title → título da aula na sidebar",
        "- .lesson-sidebar-next-module → botão 'Próximo módulo' na sidebar",
        "- .lesson-nav-bar        → barra com botões Anterior / Próxima / Concluir",
        "- .lesson-complete-btn   → botão 'Marcar como concluída'",
        "- .lesson-complete-btn-done → estado do botão quando a aula foi concluída",
        "- .lesson-cta-button     → botão CTA abaixo do vídeo",
        "- .lesson-cta-hint       → texto de dica abaixo do CTA",
        "- .lesson-accordion-item → item de accordion (FAQ ou materiais complementares)",
        "- .lesson-accordion-trigger → trigger (cabeçalho clicável) do accordion",
        "",
        "## Conteúdo da Aula (Descrição, Material, FAQ)",
        "- .lesson-card-header     → cabeçalho dos cards de conteúdo (ícone + título)",
        "- .lesson-card-header i   → ícone do cabeçalho (livro, clipe, interrogação)",
        "- .lesson-card-header h3  → título do cabeçalho",
        "- .lesson-description-card → card da seção 'Descrição'",
        "- .lesson-description-body → corpo do texto da descrição (HTML injetado)",
        "- .lesson-description-body a → links na descrição da aula",
        "- .lesson-documents-card  → card da seção 'Material Complementar'",
        "- .lesson-document-item   → linha de cada documento/arquivo",
        "- .lesson-document-info i → ícone do arquivo (file icon)",
        "- .lesson-doc-btn-view    → botão 'Visualizar' documento",
        "- .lesson-doc-btn-download → botão 'Baixar' documento",
        "- .lesson-faq-card        → card da seção 'Perguntas Frequentes'",
        "- .lesson-faq-item        → cada pergunta (container)",
        "- .lesson-faq-item-open   → pergunta expandida/aberta",
        "- .lesson-faq-question    → botão clicável da pergunta",
        "- .lesson-faq-number      → número circular ao lado da pergunta",
        "- .lesson-faq-answer p    → texto da resposta",
        "",
        "# Regras obrigatórias",
        "- Escreva apenas CSS puro — sem HTML, sem JavaScript",
        "- Use @import do Google Fonts no topo do arquivo se precisar de fontes externas",
        "- Prefira variáveis CSS (:root { --nome: valor }) para cores e fontes, facilitando consistência",
        "- Não use !important, a menos que absolutamente necessário para sobrescrever",
        "- Não remova nem sobrescreva propriedades estruturais como display, position, grid, flex, width, height em containers de layout",
        "- O resultado será colado diretamente num campo de texto — retorne apenas o CSS, sem explicações, sem blocos markdown",
        "",
        "# Cuidados para evitar bugs e incompatibilidades",
        "- SEMPRE escope os seletores dentro de .member-page ou nas classes específicas listadas — NUNCA use seletores genéricos como h1, h2, p, a, div, button, input sem escopo. Isso causaria vazamento de estilos para outras partes da plataforma (painel admin, modais, etc.)",
        "- Não use o seletor universal (*) nem reset global de body ou html — podem quebrar o layout inteiro da aplicação",
        "- Não altere z-index de .member-header, modais, dropdowns ou do player de vídeo — esses valores são críticos para sobreposição correta de elementos",
        "- Não defina overflow: hidden em .member-page, .lesson-page-layout ou .member-main — isso quebraria o scroll da página e o header sticky",
        "- Não use transform em containers de layout (como .member-page ou .lesson-page-layout) — isso cria um novo contexto de empilhamento e quebra elementos com position: fixed ou sticky",
        "- Não sobrescreva classes do player de vídeo Vidstack (prefixo .vds-*) — o player tem seu próprio sistema de estilos",
        "- Ao usar @keyframes, prefixe o nome da animação com 'custom-' para evitar conflitos com animações existentes da plataforma (ex: @keyframes custom-fade-in)",
        "- Não defina font-size ou line-height em seletores amplos (* ou .member-page) — isso afeta todos os textos, incluindo tamanhos de ícones e elementos de UI internos",
        "- Teste sempre os estados hover, active e :focus dos elementos — certifique-se de que os estilos de interação estão explícitos e não dependem apenas de cores padrão do browser",
        "",
        "# Saída esperada",
        "Um arquivo CSS completo e funcional, pronto para ser colado, que transforma visualmente a área de membros com o estilo solicitado, sem quebrar nenhuma funcionalidade existente.",
    ].join("\n");
}

function buildAdaptPrompt(input: string, css: string): string {
    const obs = input.trim() || "Mantenha a identidade visual original (cores, tipografia, estilo) da forma mais fiel possível.";
    const currentCss = css.trim() || "[COLE SEU CSS NO CAMPO ACIMA ANTES DE COPIAR ESTE PROMPT]";
    return [
        "# Contexto",
        "Você está ajudando a personalizar a área de membros de uma plataforma de cursos online chamada Membrium.",
        "Tenho um CSS que criei para outra parte da plataforma (ex: página de login ou landing page) e preciso adaptá-lo para funcionar na área de membros.",
        "A área de membros é uma aplicação React existente — o CSS será injetado como <style> global.",
        "Não crie HTML nem JavaScript — apenas CSS puro.",
        "",
        "# O que preservar",
        obs,
        "",
        "# O que fazer",
        "Adapte o CSS fornecido para que as cores, fontes e estilos sejam aplicados corretamente nas classes da área de membros.",
        "Não é necessário recriar o design do zero — apenas mapeie os estilos existentes para as classes corretas abaixo.",
        "",
        "# Classes da área de membros para aplicar os estilos",
        "- .member-page           → fundo geral (home + lesson)",
        "- .member-header         → navbar superior",
        "- .member-header-scrolled → header após scroll",
        "- .member-logo           → nome/logo (reset background-clip para cor sólida)",
        "- .member-nav-link       → links de menu",
        "- .member-icon-btn       → botões de ícone no header",
        "- .member-avatar         → avatar do aluno no header",
        "- .member-dropdown       → dropdown do avatar",
        "- .member-module-card    → card de módulo",
        "- .member-module-card:hover → hover do card",
        "- .member-module-play-overlay → overlay com play no hover",
        "- .member-module-play-overlay i → ícone play (botão circular)",
        "- .member-module-name    → título do módulo",
        "- .member-module-progress-bar → container barra de progresso",
        "- .member-module-progress-fill → preenchimento da barra (cor)",
        "- .member-course-title   → título do curso",
        "- .member-course-nav-btn → setas do carrossel",
        "- .member-footer         → rodapé",
        "- .member-bottom-nav     → barra mobile inferior",
        "- .member-bottom-nav-item → item da barra mobile",
        "- .member-bottom-nav-active → item ativo mobile",
        "- .member-search-modal   → modal de busca",
        "- .member-profile-card   → cards do perfil",
        "- .member-profile-btn    → botão salvar do perfil",
        "- .member-profile-input  → inputs do perfil",
        "- .member-profile-avatar-small → avatar do perfil",
        "- .group-selector-card   → card de seleção de trilha",
        "- .grouped-course-row-title → título de curso na trilha",
        "- .lesson-breadcrumb-bar → barra de breadcrumb",
        "- .lesson-page-layout    → grid principal",
        "- .lesson-sidebar        → sidebar de aulas",
        "- .lesson-sidebar-header → cabeçalho da sidebar",
        "- .lesson-sidebar-item   → item de aula na sidebar",
        "- .lesson-sidebar-item-active → aula ativa na sidebar",
        "- .lesson-sidebar-item-icon → ícone circular (play/número/check)",
        "- .lesson-sidebar-item-title → título da aula na sidebar",
        "- .lesson-sidebar-next-module → botão 'Próximo módulo'",
        "- .lesson-complete-btn   → botão concluir aula",
        "- .lesson-complete-btn-done → estado concluído",
        "- .lesson-cta-button     → botão CTA abaixo do vídeo",
        "- .lesson-cta-hint       → texto de dica abaixo do CTA",
        "- .lesson-card-header i  → ícone dos cards de conteúdo (Descrição, FAQ, Docs)",
        "- .lesson-card-header h3 → título dos cards de conteúdo",
        "- .lesson-description-body a → links na descrição da aula",
        "- .lesson-document-item  → item de documento/material",
        "- .lesson-doc-btn-view   → botão visualizar doc",
        "- .lesson-doc-btn-download → botão baixar doc",
        "- .lesson-faq-item       → pergunta FAQ (container)",
        "- .lesson-faq-question   → botão clicável da pergunta",
        "- .lesson-faq-number     → número circular da pergunta",
        "- .lesson-faq-answer p   → texto da resposta",
        "",
        "# Regras e cuidados para evitar bugs",
        "- Retorne apenas o CSS adaptado, sem explicações, sem markdown",
        "- Não remova propriedades estruturais (display, grid, position, flex, width, height em containers de layout)",
        "- Use @import do Google Fonts se o CSS original usar fontes externas",
        "- Sempre escope os seletores nas classes .member-* e .lesson-* listadas — nunca use seletores genéricos (h1, p, div, a) sem escopo, pois o CSS é global e pode vazar para outras partes da plataforma",
        "- Não altere z-index de elementos de overlay, modais ou do header",
        "- Não defina overflow: hidden em containers principais de layout",
        "- Prefixe @keyframes com 'custom-' para evitar conflitos com animações existentes",
        "",
        "# Meu CSS original (para adaptar)",
        currentCss,
        "",
        "# Saída esperada",
        "CSS completo e pronto para colar, com a identidade visual adaptada para as classes da área de membros.",
    ].join("\n");
}

function buildTweakPrompt(input: string, css: string): string {
    const what = input.trim() || "[DESCREVA O QUE QUER MUDAR]";
    const currentCss = css.trim() || "[COLE SEU CSS NO CAMPO ACIMA ANTES DE COPIAR ESTE PROMPT]";
    return [
        "# Contexto",
        "Você está ajudando a ajustar o CSS da área de membros de uma plataforma de cursos online chamada Membrium.",
        "A área de membros é uma aplicação React existente — o CSS é injetado como <style> global.",
        "Tenho um CSS já funcionando e quero fazer ajustes pontuais sem quebrar o restante.",
        "",
        "# Ajuste solicitado",
        what,
        "",
        "# Regras e cuidados para evitar bugs",
        "- Faça APENAS os ajustes pedidos — não altere o que não foi solicitado",
        "- Não remova propriedades estruturais (display, grid, position, flex, width, height em containers de layout)",
        "- Não use !important sem necessidade real",
        "- Retorne o CSS completo com os ajustes já aplicados — sem explicações, sem markdown",
        "- Mantenha todos os seletores escopados em .member-page ou nas classes .member-* e .lesson-* — nunca adicione seletores genéricos sem escopo",
        "- Não altere z-index de overlay, modal ou header — esses valores são críticos",
        "- Não defina overflow: hidden em .member-page ou containers de layout principal",
        "- Se o ajuste usar @keyframes, prefixe com 'custom-' para não conflitar com animações existentes",
        "",
        "# CSS atual (para ajustar)",
        currentCss,
        "",
        "# Saída esperada",
        "O CSS completo (com os ajustes já aplicados), pronto para colar diretamente no campo de personalização.",
    ].join("\n");
}

// ─── Config ───────────────────────────────────────────────────────

const PROMPTS: Record<PromptKey, PromptConfig> = {
    create: {
        label: "Criar do zero",
        icon: "ri-magic-line",
        inputLabel: "Descreva o estilo desejado",
        inputPlaceholder: "Ex: dark minimalista estilo Netflix com tons de vermelho...",
        rows: 3,
        examples: [
            "dark minimalista estilo Netflix com vermelho e cinza",
            "western cowboy com couro escuro, dourado e fonte serifada",
            "design do Flamengo com preto e vermelho, escudo como inspiração",
            "futurista neon estilo cyberpunk com roxo e ciano",
            "elegante estilo Apple com branco, preto e tipografia clean",
            "natureza e sustentabilidade com verde, bege e fontes orgânicas",
        ],
        build: (input) => buildCreatePrompt(input),
    },
    adapt: {
        label: "Adaptar tema",
        icon: "ri-swap-line",
        inputLabel: "O que quer preservar da identidade visual?",
        inputPlaceholder: "Ex: manter as cores roxo e dourado, mas aplicar na área de membros...",
        rows: 3,
        examples: [
            "manter as cores da minha marca (azul marinho #0a2342 e dourado #d4a017)",
            "preservar a fonte Montserrat e o esquema dark com bordas neon",
            "adaptar mantendo o estilo minimalista mas com mais espaçamento",
            "usar o mesmo gradiente roxo-rosa que tenho na landing page",
        ],
        build: (input, css) => buildAdaptPrompt(input, css),
    },
    tweak: {
        label: "Ajuste fino",
        icon: "ri-edit-line",
        inputLabel: "O que quer ajustar no tema atual?",
        inputPlaceholder: "Ex: deixar os cards mais arredondados e adicionar animação de hover...",
        rows: 3,
        examples: [
            "deixar os cards de módulo mais arredondados (border-radius maior)",
            "mudar a cor do botão 'Marcar como concluída' para verde",
            "adicionar uma animação suave de hover nos cards de módulo",
            "deixar o header com glassmorphism (blur + transparência)",
            "aumentar o tamanho da fonte dos títulos e adicionar letter-spacing",
            "adicionar uma borda neon brilhante nos cards ao passar o mouse",
        ],
        build: (input, css) => buildTweakPrompt(input, css),
    },
};

// ─── Component ────────────────────────────────────────────────────

export function MemberAiPrompt({ css }: MemberAiPromptProps) {
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
