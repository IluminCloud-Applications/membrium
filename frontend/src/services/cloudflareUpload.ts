import { apiClient } from "./apiClient";
import type { CloudflareR2PresignResponse } from "./integrations";

/**
 * Upload de vídeo direto do browser para o Cloudflare R2 via Presigned URLs.
 *
 * ## Por que Direct Upload?
 *
 * Ao fazer o upload diretamente para o R2, evitamos passar dados de arquivos
 * grandes pelo backend. Isso resolve limites de corpo de requisição (413 Payload Too Large)
 * impostos por proxies como Nginx ou Cloudflare Proxy (que limita a 100MB no plano Free/Pro).
 *
 * ## Requisito de CORS
 *
 * O Cloudflare R2 exige que o bucket tenha uma política CORS explícita configurada
 * no Dashboard da Cloudflare para permitir requisições PUT e OPTIONS a partir do domínio do frontend.
 *
 * ## Fluxo
 *
 *   1. Browser pede URL Pré-assinada ao Backend (JSON rápido).
 *   2. Browser faz PUT do arquivo diretamente no R2.
 */

export interface CloudflareUploadResult {
    /** URL pública no custom domain R2 — salvar na lição */
    publicUrl: string;
    /** Chave do objeto no R2 (videos/<ts>-<id>-<name>) */
    key: string;
}

export interface CloudflareUploadOptions {
    /** Chamado periodicamente com fração 0..1 do progresso de upload */
    onProgress?: (fraction: number) => void;
    /** AbortSignal — suporta cancelamento via xhr.abort() */
    signal?: AbortSignal;
}

export const cloudflareUploadService = {
    /**
     * Obtém uma URL pré-assinada do backend e envia o arquivo diretamente para o R2.
     * Usa XHR para suportar progresso de upload (fetch não expõe isso).
     */
    async upload(
        file: File,
        options: CloudflareUploadOptions = {},
    ): Promise<CloudflareUploadResult> {
        // 1. Obter a URL pré-assinada e os headers necessários
        const presignRes = await apiClient.post<CloudflareR2PresignResponse>(
            "/settings/cloudflare-r2/presign",
            {
                filename: file.name,
                content_type: file.type || "video/mp4",
            }
        );

        if (!presignRes.success || !presignRes.upload_url) {
            throw new Error(presignRes.message || "Falha ao obter URL de upload do R2");
        }

        // 2. Fazer o PUT do arquivo bruto diretamente no R2
        await uploadDirectViaXhr(
            presignRes.upload_url,
            file,
            presignRes.headers || {},
            options
        );

        return {
            publicUrl: presignRes.public_url,
            key: presignRes.key,
        };
    },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function uploadDirectViaXhr(
    url: string,
    file: File,
    headers: Record<string, string>,
    { onProgress, signal }: CloudflareUploadOptions,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);

        // O upload direto usa a assinatura contida na URL, dispensando cookies/credenciais do app
        xhr.withCredentials = false;

        // Adiciona os headers exigidos pela assinatura do S3/R2 (como o Content-Type)
        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });

        // Acompanha o progresso real do envio do arquivo ao R2
        xhr.upload.onprogress = (evt) => {
            if (onProgress && evt.lengthComputable) {
                onProgress(evt.loaded / evt.total);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress?.(1);
                resolve();
            } else {
                reject(
                    new Error(
                        `Falha no upload direto para R2 (${xhr.status}): ${xhr.statusText}`
                    ),
                );
            }
        };

        xhr.onerror = () =>
            reject(new Error("Erro de rede ao enviar arquivo para o Cloudflare R2"));
        xhr.onabort = () =>
            reject(new DOMException("Upload cancelado", "AbortError"));

        if (signal) {
            if (signal.aborted) {
                xhr.abort();
                return;
            }
            signal.addEventListener("abort", () => xhr.abort(), { once: true });
        }

        xhr.send(file);
    });
}
