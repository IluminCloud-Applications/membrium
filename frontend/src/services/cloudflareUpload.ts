/**
 * Upload de vídeo via proxy do backend → Cloudflare R2.
 *
 * ## Por que proxy e não upload direto ao R2?
 *
 * O Cloudflare R2 bloqueia requisições cross-origin do browser (CORS) a menos que
 * o bucket tenha uma política CORS explícita configurada. Configurar CORS no R2
 * requer um API Token separado e acesso ao dashboard do Cloudflare.
 *
 * Com o proxy, o browser envia o arquivo para o nosso backend, e o backend
 * usa boto3 (sem restrições de CORS) para enviar ao R2 via multipart streaming.
 *
 * ## Performance
 *
 * O gargalo real é sempre o browser → servidor (limitado pela internet do usuário).
 * O trecho servidor → R2 acontece em data center com fibra de 1 Gbps — na prática
 * não adiciona tempo perceptível ao usuário.
 *
 * ## Fluxo
 *
 *   Browser ──(upload speed)──► Backend ──(1 Gbps)──► R2
 *
 * O backend usa boto3 TransferConfig com chunks de 8 MB e upload multipart paralelo,
 * então nunca carrega o arquivo inteiro na RAM.
 */

const UPLOAD_ENDPOINT = "/api/settings/cloudflare-r2/upload";

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
     * Envia um arquivo para o R2 via proxy do backend.
     * Usa XHR para suportar progresso de upload (fetch não expõe isso).
     */
    async upload(
        file: File,
        options: CloudflareUploadOptions = {},
    ): Promise<CloudflareUploadResult> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("content_type", file.type || "video/mp4");

        const result = await uploadViaXhr(UPLOAD_ENDPOINT, formData, options);
        return { publicUrl: result.public_url, key: result.key };
    },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface UploadResponse {
    success: boolean;
    public_url: string;
    key: string;
    message?: string;
}

function uploadViaXhr(
    url: string,
    body: FormData,
    { onProgress, signal }: CloudflareUploadOptions,
): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        // Envia cookies de sessão — necessário para @admin_required no backend
        xhr.withCredentials = true;

        // Progresso reflete o upload browser → servidor (a leg mais lenta)
        xhr.upload.onprogress = (evt) => {
            if (onProgress && evt.lengthComputable) {
                onProgress(evt.loaded / evt.total);
            }
        };

        xhr.onload = () => {
            let data: UploadResponse;
            try {
                data = JSON.parse(xhr.responseText);
            } catch {
                reject(new Error(`Resposta inválida do servidor (${xhr.status})`));
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
                onProgress?.(1);
                resolve(data);
            } else {
                reject(
                    new Error(
                        data.message ||
                            `Upload falhou (${xhr.status}): ${xhr.statusText}`,
                    ),
                );
            }
        };

        xhr.onerror = () =>
            reject(new Error("Erro de rede ao enviar arquivo para o servidor"));
        xhr.onabort = () =>
            reject(new DOMException("Upload cancelado", "AbortError"));

        if (signal) {
            if (signal.aborted) {
                xhr.abort();
                return;
            }
            signal.addEventListener("abort", () => xhr.abort(), { once: true });
        }

        xhr.send(body);
    });
}
