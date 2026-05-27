import { useState } from "react";
import type { MemberLessonDocument } from "@/types/member";

interface LessonPdfEmbedProps {
    documents: MemberLessonDocument[];
}

/** Shown in place of the video player when a lesson has no video but has PDFs/documents. */
export function LessonPdfEmbed({ documents }: LessonPdfEmbedProps) {
    const pdfDocs = documents.filter((d) =>
        d.filename?.toLowerCase().endsWith(".pdf")
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const activeDoc = pdfDocs[activeIndex] ?? documents[0];

    if (!activeDoc) return null;

    const isPdf = activeDoc.filename?.toLowerCase().endsWith(".pdf");
    const fileUrl = `/static/uploads/${activeDoc.filename}`;
    // #page=1&toolbar=0&navpanes=0 — hints to the PDF renderer to show only page 1, no UI chrome
    const previewUrl = isPdf ? `${fileUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH` : fileUrl;

    return (
        <div className="lesson-pdf-embed">
            {/* Tab bar — shown when multiple PDF docs */}
            {pdfDocs.length > 1 && (
                <div className="lesson-pdf-tabs">
                    {pdfDocs.map((doc, i) => (
                        <button
                            key={doc.id}
                            className={`lesson-pdf-tab ${i === activeIndex ? "lesson-pdf-tab-active" : ""}`}
                            onClick={() => setActiveIndex(i)}
                            title={doc.filename}
                        >
                            <i className="ri-file-pdf-2-line" />
                            <span className="lesson-pdf-tab-name">{doc.filename}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Desktop: fully interactive iframe embed */}
            <div className="lesson-pdf-desktop-view">
                {isPdf ? (
                    <div className="lesson-pdf-ratio-box">
                        <iframe
                            key={activeDoc.id}
                            src={fileUrl}
                            className="lesson-pdf-iframe"
                            title={activeDoc.filename}
                        />
                    </div>
                ) : (
                    <div className="lesson-pdf-fallback">
                        <i className="ri-file-download-line" />
                        <h3>{activeDoc.filename}</h3>
                        <p>Este arquivo não pode ser visualizado diretamente.</p>
                        <a href={fileUrl} download={activeDoc.filename} className="lesson-pdf-download-btn">
                            <i className="ri-download-cloud-2-line" />
                            Baixar Arquivo
                        </a>
                    </div>
                )}
            </div>

            {/* Mobile: first-page preview + full-area tap to open */}
            <div className="lesson-pdf-mobile-view">
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lesson-pdf-preview-link"
                    aria-label={`Abrir ${activeDoc.filename}`}
                >
                    {/* Non-interactive iframe — renders first page visually */}
                    <iframe
                        key={`preview-${activeDoc.id}`}
                        src={previewUrl}
                        className="lesson-pdf-preview-iframe"
                        title={`Preview — ${activeDoc.filename}`}
                        tabIndex={-1}
                        aria-hidden="true"
                    />

                    {/* Gradient overlay + open button */}
                    <div className="lesson-pdf-preview-overlay">
                        <div className="lesson-pdf-preview-badge">
                            <i className="ri-file-pdf-2-line" />
                            <span>{activeDoc.filename}</span>
                        </div>
                        <div className="lesson-pdf-preview-cta">
                            <span className="lesson-pdf-preview-btn">
                                <i className="ri-expand-diagonal-line" />
                                Abrir em tela cheia
                            </span>
                            <p className="lesson-pdf-preview-hint">Toque em qualquer lugar para abrir</p>
                        </div>
                    </div>
                </a>

                {/* Dots navigator — multiple PDFs */}
                {pdfDocs.length > 1 && (
                    <div className="lesson-pdf-mobile-nav">
                        {pdfDocs.map((doc, i) => (
                            <button
                                key={doc.id}
                                className={`lesson-pdf-mobile-dot ${i === activeIndex ? "lesson-pdf-mobile-dot-active" : ""}`}
                                onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                                title={doc.filename}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer — always visible, download button */}
            <div className="lesson-pdf-footer">
                <i className="ri-file-pdf-2-line text-rose-400" />
                <span className="lesson-pdf-footer-name">{activeDoc.filename}</span>
                <a
                    href={fileUrl}
                    download={activeDoc.filename}
                    className="lesson-pdf-footer-btn"
                    title="Baixar PDF"
                >
                    <i className="ri-download-2-line" />
                    Baixar
                </a>
            </div>
        </div>
    );
}
