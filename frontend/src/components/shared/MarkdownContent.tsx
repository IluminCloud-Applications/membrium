import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
    content: string;
    className?: string;
}

/**
 * Reusable Markdown renderer for AI/chatbot responses.
 * Supports GFM (GitHub Flavored Markdown): tables, strikethrough, links, etc.
 *
 * Used in:
 * - ChatBubbleMessages (member area floating bubble)
 * - ChatbotTestDrawer (admin test drawer)
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
    return (
        <div className={`markdown-content ${className ?? ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
