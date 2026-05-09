import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface MemberCssEditorProps {
    value: string;
    onChange: (css: string) => void;
}

const CLASS_REFERENCE = [
    { group: "Layout", items: [
        { cls: ".member-page", desc: "Wrapper geral (home + lesson)" },
        { cls: ".member-main", desc: "Container <main> da home" },
        { cls: ".member-footer", desc: "Rodapé" },
    ]},
    { group: "Header", items: [
        { cls: ".member-header", desc: "Navbar superior" },
        { cls: ".member-header-scrolled", desc: "Header após scroll" },
        { cls: ".member-logo", desc: "Nome / logo da plataforma" },
        { cls: ".member-nav-link", desc: "Links de menu" },
        { cls: ".member-icon-btn", desc: "Botões de ícone no header" },
        { cls: ".member-avatar", desc: "Avatar do usuário" },
        { cls: ".member-dropdown", desc: "Menu dropdown do usuário" },
    ]},
    { group: "Banner do Curso", items: [
        { cls: ".member-banner", desc: "Container do banner" },
        { cls: ".member-banner-overlay", desc: "Overlay sobre o banner" },
    ]},
    { group: "Cards de Módulo", items: [
        { cls: ".member-course-section", desc: "Seção de um curso" },
        { cls: ".member-course-title", desc: "Título do curso" },
        { cls: ".member-course-badge", desc: "Badge de status" },
        { cls: ".member-carousel", desc: "Container do carrossel" },
        { cls: ".member-module-card", desc: "Card de cada módulo" },
        { cls: ".member-module-card:hover", desc: "Hover do card" },
        { cls: ".member-module-title", desc: "Título do módulo" },
        { cls: ".member-module-meta", desc: "Info (aulas, progresso)" },
        { cls: ".member-module-progress-bar", desc: "Barra de progresso" },
    ]},
    { group: "Lesson Player", items: [
        { cls: ".lesson-breadcrumb-bar", desc: "Barra de breadcrumb" },
        { cls: ".lesson-breadcrumb-link", desc: "Link Voltar" },
        { cls: ".lesson-page-layout", desc: "Grid principal" },
        { cls: ".lesson-main-col", desc: "Coluna do vídeo" },
        { cls: ".lesson-video-container", desc: "Container do player" },
        { cls: ".lesson-title", desc: "Título da aula" },
        { cls: ".lesson-sidebar", desc: "Sidebar de aulas" },
        { cls: ".lesson-sidebar-header", desc: "Cabeçalho da sidebar" },
        { cls: ".lesson-sidebar-item", desc: "Item de aula na sidebar" },
        { cls: ".lesson-sidebar-item-active", desc: "Aula ativa na sidebar" },
        { cls: ".lesson-sidebar-item-icon", desc: "Ícone circular (play/número/check)" },
        { cls: ".lesson-sidebar-item-title", desc: "Título da aula na sidebar" },
        { cls: ".lesson-sidebar-next-module", desc: "Botão 'Próximo módulo'" },
        { cls: ".lesson-nav-bar", desc: "Barra prev/next/concluir" },
        { cls: ".lesson-complete-btn", desc: "Botão concluir aula" },
        { cls: ".lesson-complete-btn-done", desc: "Estado concluído" },
        { cls: ".lesson-cta-button", desc: "Botão CTA abaixo do vídeo" },
        { cls: ".lesson-cta-hint", desc: "Texto de dica abaixo do CTA" },
        { cls: ".lesson-accordion-item", desc: "Item de accordion" },
        { cls: ".lesson-accordion-trigger", desc: "Trigger do accordion" },
    ]},
    { group: "Conteúdo da Aula", items: [
        { cls: ".lesson-card-header", desc: "Cabeçalho dos cards (ícone + título)" },
        { cls: ".lesson-card-header i", desc: "Ícone do cabeçalho (Descrição, FAQ, Docs)" },
        { cls: ".lesson-card-header h3", desc: "Título do cabeçalho" },
        { cls: ".lesson-description-body", desc: "Corpo da descrição da aula" },
        { cls: ".lesson-description-body a", desc: "Links na descrição" },
        { cls: ".lesson-document-item", desc: "Item de documento/material" },
        { cls: ".lesson-document-info i", desc: "Ícone do arquivo" },
        { cls: ".lesson-doc-btn-view", desc: "Botão visualizar documento" },
        { cls: ".lesson-doc-btn-download", desc: "Botão baixar documento" },
        { cls: ".lesson-faq-item", desc: "Item de pergunta frequente" },
        { cls: ".lesson-faq-question", desc: "Pergunta (botão clicável)" },
        { cls: ".lesson-faq-number", desc: "Número circular da pergunta" },
        { cls: ".lesson-faq-answer p", desc: "Texto da resposta" },
    ]},
];

export function MemberCssEditor({ value, onChange }: MemberCssEditorProps) {
    return (
        <div className="space-y-4">
            {/* Editor */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <i className="ri-code-s-slash-line text-primary" />
                        CSS Personalizado
                    </label>
                    {value.trim() && (
                        <Badge variant="secondary" className="text-xs">
                            {value.split("\n").length} linhas
                        </Badge>
                    )}
                </div>
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={PLACEHOLDER}
                    rows={12}
                    className="font-mono text-xs resize-y leading-relaxed max-h-80 overflow-y-auto"
                    spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                    CSS injetado globalmente na área de membros (home + player de aula).
                    Use{" "}
                    <code className="bg-muted px-1 rounded text-[10px]">@import</code>{" "}
                    do Google Fonts no topo se precisar de fontes externas.
                </p>
            </div>

            {/* Class reference accordion */}
            <details className="group border border-border/60 rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors select-none list-none">
                    <span className="flex items-center gap-2">
                        <i className="ri-list-check-2 text-primary/70" />
                        Classes CSS disponíveis
                    </span>
                    <i className="ri-arrow-down-s-line transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-2 space-y-4 bg-muted/20">
                    {CLASS_REFERENCE.map((group) => (
                        <div key={group.group}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                {group.group}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <div key={item.cls} className="flex items-baseline gap-3 text-xs">
                                        <code className="shrink-0 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary/90 whitespace-nowrap">
                                            {item.cls}
                                        </code>
                                        <span className="text-muted-foreground">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
}

const PLACEHOLDER = `/* Exemplo: tema escuro com fonte personalizada */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

.member-page {
  font-family: 'Inter', sans-serif;
  background: #0f0f0f;
}

.member-header {
  background: #0a0a0a;
  border-bottom: 1px solid #222;
}

.member-module-card:hover {
  border-color: #E62020;
  transform: translateY(-4px);
}`;
