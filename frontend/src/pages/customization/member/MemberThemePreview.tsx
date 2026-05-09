import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MemberThemePreviewProps {
    css: string;
}

type PreviewTab = "home" | "lesson";

export function MemberThemePreview({ css }: MemberThemePreviewProps) {
    const [tab, setTab] = useState<PreviewTab>("home");

    return (
        <div className="w-full space-y-3 sticky top-6">
            {/* Tab toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <i className="ri-eye-line" />
                    <span>Preview</span>
                </div>
                <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                    {(["home", "lesson"] as PreviewTab[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                tab === t
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <i className={t === "home" ? "ri-home-4-line" : "ri-play-circle-line"} />
                            {t === "home" ? "Home" : "Aula"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview frame */}
            <div className="rounded-xl border border-border overflow-hidden shadow-lg w-full aspect-video">
                <ScaledIframe css={css} tab={tab} />
            </div>

            <p className="text-xs text-center text-muted-foreground">
                Visualização em miniatura — a página real será em tela cheia.
            </p>
        </div>
    );
}

/* ─── Scaled iframe ─────────────────────────────────────────────── */

function ScaledIframe({ css, tab }: { css: string; tab: PreviewTab }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const realW = 1280;
    const realH = 720;
    const scale = containerW > 0 ? containerW / realW : 1;

    const html = tab === "home" ? buildHomeHtml(css) : buildLessonHtml(css);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden relative">
            {containerW > 0 && (
                <iframe
                    key={tab + css}
                    srcDoc={html}
                    title={`Preview ${tab}`}
                    sandbox="allow-scripts"
                    style={{
                        width: `${realW}px`,
                        height: `${realH}px`,
                        border: "none",
                        transformOrigin: "top left",
                        transform: `scale(${scale})`,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    );
}

/* ─── HTML builders ─────────────────────────────────────────────── */

function buildHomeHtml(css: string): string {
    const BASE_CSS = getBaseCss();
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,sans-serif}
${BASE_CSS}
${css}
</style>
</head>
<body>
<div class="member-page dark">
  <header class="member-header">
    <div class="member-header-inner">
      <span class="member-logo">MinhPlataforma</span>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="member-nav-link" style="font-size:13px">Cursos</span>
        <span class="member-nav-link" style="font-size:13px">Suporte</span>
        <span class="member-icon-btn" style="font-size:18px">🔔</span>
        <div class="member-avatar" style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px">JS</div>
      </div>
    </div>
  </header>

  <div class="member-banner" style="height:260px;position:relative;overflow:hidden;background:#111">
    <div class="member-banner-overlay" style="position:absolute;inset:0;padding:40px;display:flex;flex-direction:column;justify-content:flex-end">
      <h1 class="member-course-title member-course-title-primary" style="font-size:28px;margin:0 0 8px">Marketing Digital Pro</h1>
      <p class="member-course-description" style="font-size:14px;max-width:500px">Aprenda as estratégias mais avançadas do marketing digital e acelere seu negócio online.</p>
    </div>
  </div>

  <main class="member-main">
    <div class="member-course-section">
      <div class="member-course-header">
        <h2 class="member-course-title">Módulos do Curso</h2>
      </div>
      <div class="member-carousel">
        <div class="member-carousel-track" style="display:flex;gap:14px;overflow:hidden">
          ${[
              ["Introdução ao Marketing", "8 aulas", "100%"],
              ["SEO e Tráfego Orgânico", "12 aulas", "65%"],
              ["Tráfego Pago", "10 aulas", "30%"],
              ["Email Marketing", "6 aulas", "0%"],
              ["Redes Sociais", "9 aulas", "0%"],
          ].map(([title, lessons, progress]) => `
          <div class="member-module-card" style="min-width:180px;flex-shrink:0;cursor:pointer;overflow:hidden;border-radius:10px">
            <div class="member-module-image-wrap" style="position:relative;height:100px;overflow:hidden">
              <div class="member-module-image" style="height:100%;background:linear-gradient(135deg,#333,#1a1a1a)"></div>
              <div class="member-module-play-overlay"><i style="display:flex;align-items:center;justify-content:center">▶</i></div>
              <div class="member-module-progress-bar" style="position:absolute;bottom:0;left:0;right:0;height:4px">
                <div class="member-module-progress-fill" style="width:${progress};height:100%;border-radius:2px"></div>
              </div>
            </div>
            <div class="member-module-info" style="padding:10px">
              <p class="member-module-name" style="margin:0 0 4px;font-size:12px;font-weight:600">${title}</p>
              <p class="member-module-meta" style="margin:0;font-size:11px">${lessons}</p>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </div>
  </main>

  <footer class="member-footer">
    <p>MinhPlataforma · Todos os direitos reservados</p>
  </footer>
</div>
</body>
</html>`;
}

function buildLessonHtml(css: string): string {
    const BASE_CSS = getBaseCss();
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,sans-serif}
${BASE_CSS}
${css}
</style>
</head>
<body>
<div class="member-page dark">
  <header class="member-header">
    <div class="member-header-inner">
      <span class="member-logo">MinhPlataforma</span>
    </div>
  </header>

  <div class="lesson-breadcrumb-bar">
    <span class="lesson-breadcrumb-link">← Voltar para Cursos</span>
    <div class="lesson-breadcrumb-trail">
      <span>Marketing Digital Pro</span> › <span>SEO e Tráfego Orgânico</span>
    </div>
  </div>

  <main class="lesson-page-layout">
    <div class="lesson-main-col">
      <div class="lesson-video-container" style="aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center">
        <span style="font-size:48px;opacity:0.3">▶</span>
      </div>

      <div class="lesson-nav-bar" style="margin-top:12px">
        <button style="padding:8px 16px;font-size:12px">← Anterior</button>
        <button class="lesson-complete-btn" style="padding:8px 16px;font-size:12px">Marcar como concluída</button>
        <button style="padding:8px 16px;font-size:12px">Próxima →</button>
      </div>

      <div class="lesson-title-section" style="padding:16px 0">
        <h1 class="lesson-title" style="margin:0">Aula 3: Pesquisa de Palavras-chave</h1>
      </div>

      <div class="lesson-accordion-item">
        <div class="lesson-accordion-trigger" style="padding:10px 12px;cursor:pointer">📄 Material complementar</div>
      </div>

      <!-- Content sections -->
      <div class="lesson-content-area" style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
        <section class="lesson-description-card" style="padding:12px">
          <div class="lesson-card-header" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px">
            <i style="font-size:14px">📖</i>
            <h3 style="margin:0;font-size:13px">Descrição</h3>
          </div>
          <div class="lesson-description-body" style="font-size:12px;line-height:1.6">
            <p style="margin:0 0 4px">Nesta aula você vai aprender sobre pesquisa de palavras-chave. Veja o <a href="#">guia completo aqui</a>.</p>
          </div>
        </section>

        <section class="lesson-documents-card" style="padding:12px">
          <div class="lesson-card-header" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px">
            <i style="font-size:14px">📎</i>
            <h3 style="margin:0;font-size:13px">Material Complementar</h3>
          </div>
          <div class="lesson-documents-list" style="display:flex;flex-direction:column;gap:4px">
            <div class="lesson-document-item" style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px">
              <div class="lesson-document-info" style="display:flex;align-items:center;gap:6px">
                <i style="font-size:13px">📄</i>
                <span class="lesson-document-name" style="font-size:11px">planilha-seo.xlsx</span>
              </div>
              <div style="display:flex;gap:4px">
                <span class="lesson-doc-btn lesson-doc-btn-view" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:11px;cursor:pointer">👁</span>
                <span class="lesson-doc-btn lesson-doc-btn-download" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:11px;cursor:pointer">⬇</span>
              </div>
            </div>
          </div>
        </section>

        <section class="lesson-faq-card" style="padding:12px">
          <div class="lesson-card-header" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px">
            <i style="font-size:14px">❓</i>
            <h3 style="margin:0;font-size:13px">Perguntas Frequentes</h3>
          </div>
          <div class="lesson-faq-list" style="display:flex;flex-direction:column;gap:4px">
            <div class="lesson-faq-item" style="border-radius:6px;overflow:hidden">
              <button class="lesson-faq-question" style="width:100%;display:flex;align-items:center;gap:6px;padding:8px;font-size:11px;text-align:left;cursor:pointer">
                <div class="lesson-faq-number" style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">1</div>
                <span>Preciso de ferramentas pagas?</span>
                <i class="lesson-faq-chevron" style="margin-left:auto;font-size:14px">⌄</i>
              </button>
            </div>
            <div class="lesson-faq-item lesson-faq-item-open" style="border-radius:6px;overflow:hidden">
              <button class="lesson-faq-question" style="width:100%;display:flex;align-items:center;gap:6px;padding:8px;font-size:11px;text-align:left;cursor:pointer">
                <div class="lesson-faq-number" style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">2</div>
                <span>Quanto tempo leva para ver resultados?</span>
                <i class="lesson-faq-chevron lesson-faq-chevron-open" style="margin-left:auto;font-size:14px;transform:rotate(180deg)">⌄</i>
              </button>
              <div class="lesson-faq-answer" style="padding:0 8px 8px 36px">
                <p style="margin:0;font-size:11px">Normalmente de 3 a 6 meses para resultados orgânicos consistentes.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <aside class="lesson-sidebar">
      <div class="lesson-sidebar-header" style="padding:12px 16px">Aulas do Módulo</div>
      ${[
          ["Introdução ao SEO", true, true],
          ["Como funcionam os algoritmos", false, true],
          ["Pesquisa de Palavras-chave", true, false],
          ["On-page SEO", false, false],
          ["Link Building", false, false],
      ].map(([title, active, completed]) => `
      <div class="lesson-item ${active ? "lesson-item-active" : ""} ${completed ? "lesson-item-completed" : ""}" style="padding:10px 16px;display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer">
        <span>${completed ? "✓" : "○"}</span>
        <span>${title}</span>
      </div>`).join("")}
    </aside>
  </main>
</div>
</body>
</html>`;
}

/* ─── Base CSS (minimal member classes without user CSS) ─────────── */

function getBaseCss(): string {
    return `
/* === BASE MEMBER STYLES === */
.member-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #f2f2f2;
  display: flex;
  flex-direction: column;
}
.member-header {
  position: sticky; top: 0; z-index: 50;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}
.member-header-inner {
  max-width: 1400px; margin: 0 auto;
  padding: 0 24px; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
}
.member-logo { font-weight: 700; font-size: 16px; color: #E62020; }
.member-nav-link { color: #aaa; cursor: pointer; }
.member-icon-btn { color: #aaa; cursor: pointer; width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px; }
.member-avatar { background:#2a2a2a; color:#f2f2f2; font-weight:600; border:2px solid #444; }
.member-dropdown { background:#1f1f1f; border:1px solid #333; border-radius:8px; }
.member-banner { position:relative; }
.member-banner-overlay { position:absolute;inset:0; background:linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, transparent 100%); }
.member-main { flex:1; max-width:1400px; margin:0 auto; width:100%; padding:24px 24px; }
.member-course-section { margin-bottom:32px; }
.member-course-header { margin-bottom:16px; }
.member-course-title { font-size:18px; font-weight:700; color:#f2f2f2; margin:0; }
.member-course-title-primary { font-size:22px; }
.member-course-description { color:#aaa; font-size:14px; margin:8px 0 0; }
.member-course-badge { display:inline-block; padding:2px 8px; border-radius:4px; background:#E62020; color:#fff; font-size:11px; font-weight:600; }
.member-carousel { position:relative; }
.member-carousel-track { display:flex; gap:14px; overflow-x:auto; padding-bottom:8px; }
.member-module-card { background:#1f1f1f; border:1px solid #333; border-radius:10px; overflow:hidden; transition:all 0.2s; cursor:pointer; }
.member-module-card:hover { border-color:#E62020; transform:translateY(-2px); }
.member-module-image-wrap { position:relative; width:100%; overflow:hidden; background:#2a2a2a; }
.member-module-image { width:100%; background:#2a2a2a; }
.member-module-play-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); opacity:0; transition:opacity 0.3s; }
.member-module-play-overlay i { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#E62020,#F06422); color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; transform:scale(0.85); transition:transform 0.3s; }
.member-module-card:hover .member-module-play-overlay { opacity:1; }
.member-module-card:hover .member-module-play-overlay i { transform:scale(1); }
.member-module-name { color:#f2f2f2; font-weight:600; }
.member-module-meta { color:#888; font-size:12px; }
.member-module-progress-bar { background:#2a2a2a; height:4px; border-radius:2px; }
.member-module-progress-fill { height:100%; background:linear-gradient(90deg,#E62020,#F06422); border-radius:2px; }
.member-module-completed-badge { position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:50%; background:#3a7a3a; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; }
.member-footer { text-align:center; padding:20px; color:#666; font-size:13px; border-top:1px solid #222; }
/* Lesson */
.lesson-breadcrumb-bar { background:#111; border-bottom:1px solid #222; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; }
.lesson-breadcrumb-link { color:#888; font-size:13px; cursor:pointer; }
.lesson-breadcrumb-trail { color:#666; font-size:12px; }
.lesson-page-layout { flex:1; display:grid; grid-template-columns:1fr 320px; min-height:calc(100vh - 112px); }
.lesson-main-col { padding:24px; background:#0f0f0f; overflow-y:auto; }
.lesson-video-container { border-radius:8px; overflow:hidden; }
.lesson-title-section { border-bottom:1px solid #222; }
.lesson-title { font-size:20px; font-weight:700; color:#f2f2f2; }
.lesson-sidebar { background:#1a1a1a; border-left:1px solid #222; overflow-y:auto; }
.lesson-sidebar-header { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#888; background:#111; border-bottom:1px solid #222; }
.lesson-item { color:#ccc; border-bottom:1px solid #1f1f1f; cursor:pointer; transition:all 0.15s; }
.lesson-item:hover { background:rgba(230,32,32,0.06); color:#f2f2f2; }
.lesson-item-active { background:rgba(230,32,32,0.12); border-left:3px solid #E62020; color:#f2f2f2; }
.lesson-item-completed { opacity:0.6; }
.lesson-nav-bar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px; background:#1a1a1a; border:1px solid #333; border-radius:8px; }
.lesson-complete-btn { background:#1f1f1f; border:1px solid #333; color:#f2f2f2; border-radius:6px; cursor:pointer; transition:all 0.2s; font-size:12px; }
.lesson-complete-btn:hover { border-color:#E62020; color:#E62020; }
.lesson-complete-btn-done { background:#1a3a1a; border-color:#3a7a3a; color:#7ed07e; }
.lesson-cta-bar { border-radius:8px; padding:16px; background:#1f1f1f; border:1px solid #333; }
.lesson-accordion-item { background:#1a1a1a; border:1px solid #333; border-radius:8px; overflow:hidden; margin-bottom:6px; }
.lesson-accordion-trigger { color:#ccc; font-size:13px; }
/* Content area */
.lesson-description-card, .lesson-documents-card, .lesson-faq-card { background:#121212; border:1px solid rgba(255,255,255,0.06); border-radius:8px; }
.lesson-card-header { border-bottom:1px solid rgba(255,255,255,0.06); }
.lesson-card-header i { color:#E65020; }
.lesson-card-header h3 { font-size:13px; font-weight:600; color:#e0e0e0; }
.lesson-description-body { color:#aaa; font-size:12px; line-height:1.6; }
.lesson-description-body a { color:#E65020; text-decoration:underline; }
.lesson-description-body a:hover { color:#F08040; }
.lesson-document-item { background:#0f0f0f; border:1px solid rgba(255,255,255,0.05); border-radius:6px; transition:all 0.15s; }
.lesson-document-item:hover { background:rgba(255,255,255,0.04); }
.lesson-document-info i { color:#888; }
.lesson-document-name { color:#ccc; font-size:12px; }
.lesson-doc-btn-view { color:#6699CC; background:rgba(102,153,204,0.12); border-radius:4px; }
.lesson-doc-btn-view:hover { background:rgba(102,153,204,0.22); }
.lesson-doc-btn-download { color:#E65020; background:rgba(230,80,32,0.12); border-radius:4px; }
.lesson-doc-btn-download:hover { background:rgba(230,80,32,0.22); }
.lesson-faq-item { background:#0f0f0f; border:1px solid rgba(255,255,255,0.05); border-radius:6px; }
.lesson-faq-item-open { border-color:rgba(255,255,255,0.1); }
.lesson-faq-question { color:#ddd; font-size:12px; }
.lesson-faq-question:hover { background:rgba(255,255,255,0.04); }
.lesson-faq-number { background:rgba(230,32,32,0.2); color:#E65020; font-size:10px; font-weight:600; }
.lesson-faq-chevron { color:#666; }
.lesson-faq-answer p { color:#999; font-size:11px; line-height:1.5; }
button { background:none; border:1px solid #333; color:#ccc; border-radius:6px; cursor:pointer; }
`;
}
