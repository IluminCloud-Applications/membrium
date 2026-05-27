import { useState } from "react";
import type { MemberLessonDocument } from "@/types/member";

interface LessonPdfEmbedProps {
    documents: MemberLessonDocument[];
}

const isImage = (filename?: string) => {
    if (!filename) return false;
    const ext = filename.toLowerCase().split(".").pop() || "";
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
};

const isPdf = (filename?: string) => {
    return filename?.toLowerCase().endsWith(".pdf") || false;
};

/** Shown in place of the video player when a lesson has no video but has PDFs/documents. */
export function LessonPdfEmbed({ documents }: LessonPdfEmbedProps) {
    const viewableDocs = documents.filter((d) => {
        const name = d.filename?.toLowerCase() || "";
        return isPdf(name) || isImage(name);
    });

    const [activeIndex, setActiveIndex] = useState(0);
    const activeDoc = viewableDocs[activeIndex] ?? documents[0];

    if (!activeDoc) return null;

    // Special case: if there is exactly 1 document and it's an image,
    // render it directly and cleanly on the page.
    if (viewableDocs.length === 1 && isImage(viewableDocs[0].filename)) {
        const fileUrl = `/static/uploads/${viewableDocs[0].filename}`;
        return (
            <div className="lesson-single-image-wrapper">
                <img
                    src={fileUrl}
                    alt={viewableDocs[0].filename}
                    className="lesson-single-image"
                />
            </div>
        );
    }

    const activeIsPdf = isPdf(activeDoc.filename);
    const activeIsImg = isImage(activeDoc.filename);
    const fileUrl = `/static/uploads/${activeDoc.filename}`;

    return (
        <div className="lesson-pdf-embed">
            {/* Tab bar — shown when multiple viewable docs */}
            {viewableDocs.length > 1 && (
                <div className="lesson-pdf-tabs">
                    {viewableDocs.map((doc, i) => {
                        const isDocImg = isImage(doc.filename);
                        return (
                            <button
                                key={doc.id}
                                className={`lesson-pdf-tab ${i === activeIndex ? "lesson-pdf-tab-active" : ""}`}
                                onClick={() => setActiveIndex(i)}
                                title={doc.filename}
                            >
                                <i className={isDocImg ? "ri-image-line" : "ri-file-pdf-2-line"} />
                                <span className="lesson-pdf-tab-name">{doc.filename}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Desktop: fully interactive iframe embed or image */}
            <div className="lesson-pdf-desktop-view">
                {activeIsPdf ? (
                    <div className="lesson-pdf-ratio-box">
                        <iframe
                            key={activeDoc.id}
                            src={fileUrl}
                            className="lesson-pdf-iframe"
                            title={activeDoc.filename}
                        />
                    </div>
                ) : activeIsImg ? (
                    <div className="lesson-image-container">
                        <img
                            src={fileUrl}
                            className="lesson-image-content"
                            alt={activeDoc.filename}
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

            {/* Mobile: image rendering, premium card for PDF, or download fallback */}
            <div className="lesson-pdf-mobile-view">
                {activeIsImg ? (
                    <div className="lesson-image-mobile-container">
                        <img
                            src={fileUrl}
                            className="lesson-image-mobile-content"
                            alt={activeDoc.filename}
                        />
                    </div>
                ) : activeIsPdf ? (
                    <div className="lesson-pdf-mobile-card">
                        <div className="lesson-pdf-mobile-card-glow" />
                        <div className="lesson-pdf-mobile-card-content">
                            <div className="lesson-pdf-mobile-card-icon-wrapper">
                                <i className="ri-file-pdf-2-fill text-rose-500" />
                            </div>
                            <h3 className="lesson-pdf-mobile-card-title">Apresentação da Aula</h3>
                            <p className="lesson-pdf-mobile-card-text">
                                Esta aula é uma apresentação em PDF. Clique abaixo para abrir o conteúdo.
                            </p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lesson-pdf-mobile-card-btn"
                            >
                                <i className="ri-book-open-line" />
                                Abrir Apresentação
                            </a>
                        </div>
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

                {/* Dots navigator — multiple viewable docs */}
                {viewableDocs.length > 1 && (
                    <div className="lesson-pdf-mobile-nav">
                        {viewableDocs.map((doc, i) => (
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
                <i className={activeIsImg ? "ri-image-line text-rose-400" : "ri-file-pdf-2-line text-rose-400"} />
                <span className="lesson-pdf-footer-name">{activeDoc.filename}</span>
                <a
                    href={fileUrl}
                    download={activeDoc.filename}
                    className="lesson-pdf-footer-btn"
                    title={activeIsImg ? "Baixar Imagem" : "Baixar PDF"}
                >
                    <i className="ri-download-2-line" />
                    Baixar
                </a>
            </div>
        </div>
    );
}
