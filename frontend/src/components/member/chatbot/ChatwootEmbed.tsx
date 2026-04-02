import { useEffect, useState } from "react";
import { integrationsService } from "@/services/integrations";

/**
 * ChatwootEmbed — Injects the user's own Chatwoot widget script into the page.
 *
 * Only renders (injects the script) when the admin has:
 *  1. Enabled the embed mode in Integrations → Chatwoot
 *  2. Pasted a valid Chatwoot SDK <script> code
 *
 * The script is injected once and cleaned up when the component unmounts.
 * When this is active, the internal AI ChatBubble will not render.
 */
export function ChatwootEmbed() {
    const [embedScript, setEmbedScript] = useState<string | null>(null);

    useEffect(() => {
        fetchEmbed();
    }, []);

    async function fetchEmbed() {
        try {
            const data = await integrationsService.getChatwootEmbed();
            if (data.embed_enabled && data.embed_script?.trim()) {
                setEmbedScript(data.embed_script.trim());
            }
        } catch {
            // Silent — embed is optional
        }
    }

    useEffect(() => {
        if (!embedScript) return;

        const scriptContent = extractScriptContent(embedScript);
        if (!scriptContent) return;

        const script = document.createElement("script");
        script.id = "chatwoot-embed-sdk";
        script.type = "text/javascript";
        script.text = scriptContent;
        document.body.appendChild(script);

        return () => {
            // Cleanup script tag and any Chatwoot globals on unmount
            const existing = document.getElementById("chatwoot-embed-sdk");
            if (existing) existing.remove();

            const sdkScript = document.querySelector('script[src*="sdk.js"]');
            if (sdkScript) sdkScript.remove();

            const bubble = document.getElementById("chatwoot-live-chat-widget");
            if (bubble) bubble.remove();
        };
    }, [embedScript]);

    return null;
}

/**
 * Extracts the raw JavaScript content from a <script>...</script> block.
 * If the input is already plain JS (no tags), returns as-is.
 */
function extractScriptContent(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("<")) return trimmed;

    const match = trimmed.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    return match ? match[1].trim() : "";
}
