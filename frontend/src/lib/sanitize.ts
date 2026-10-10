import DOMPurify from "dompurify";

/**
 * Sanitiza HTML vindo do back-end antes de renderizar com dangerouslySetInnerHTML.
 * Remove <script>, handlers inline (onerror=...) e URLs javascript:, evitando que
 * um usuário de suporte execute código na sessão de quem visualiza a aula.
 */
export function sanitizeHtml(html: string | null | undefined): string {
    return DOMPurify.sanitize(html ?? "", { USE_PROFILES: { html: true } });
}
