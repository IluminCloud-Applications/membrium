import { useState, useEffect } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatwootEmbed } from "./ChatwootEmbed";
import { integrationsService } from "@/services/integrations";

/**
 * ChatWidget — Decides which chat experience to render:
 *
 *  • If the admin has enabled the Chatwoot Embed (own widget) → inject that SDK and hide internal bubble.
 *  • Otherwise → render the internal AI ChatBubble (which self-hides if chatbot is disabled).
 *
 * This component is drop-in-replaceable for any <ChatBubble /> usage across member pages.
 */
export function ChatWidget() {
    const [embedEnabled, setEmbedEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        checkEmbed();
    }, []);

    async function checkEmbed() {
        try {
            const data = await integrationsService.getChatwootEmbed();
            setEmbedEnabled(data.embed_enabled && Boolean(data.embed_script?.trim()));
        } catch {
            setEmbedEnabled(false);
        }
    }

    // Loading — don't flash either widget
    if (embedEnabled === null) return null;

    if (embedEnabled) {
        return <ChatwootEmbed />;
    }

    return <ChatBubble />;
}
