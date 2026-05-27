import { useState } from "react";
import type { MemberLessonDocument } from "@/types/member";

interface LessonAttachmentsModalProps {
    documents: MemberLessonDocument[];
    initialDoc?: MemberLessonDocument;
    onClose: () => void;
}

export function LessonAttachmentsModal({ documents, initialDoc, onClose }: LessonAttachmentsModalProps) {
    const [selectedDoc, setSelectedDoc] = useState<MemberLessonDocument>(initialDoc || documents[0] || null);

    if (!documents?.length) return null;

    const currentIndex = documents.findIndex(d => d.id === selectedDoc?.id);
    const isImage = (filename?: string) => {
        if (!filename) return false;
        const ext = filename.toLowerCase().split(".").pop() || "";
        return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    };

    const isPdf = selectedDoc?.filename?.toLowerCase().endsWith(".pdf");
    const isImg = isImage(selectedDoc?.filename);

    return (
        <div className="pdf-viewer-backdrop" onClick={onClose}>
            <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="pdf-viewer-header">
                    <h3 className="pdf-viewer-title" title={selectedDoc.filename}>
                        {selectedDoc.filename}
                    </h3>
                    <div className="pdf-viewer-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <a 
                            href={`/static/uploads/${selectedDoc?.filename}`} 
                            download={selectedDoc?.filename}
                            className="pdf-viewer-close"
                            title="Baixar Arquivo"
                        >
                            <i className="ri-download-cloud-2-line" />
                        </a>
                        <button className="pdf-viewer-close" onClick={onClose} title="Fechar">
                            <i className="ri-close-line" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="pdf-viewer-body">
                    {/* Viewer Area */}
                    <div className="pdf-viewer-content">
                        {isPdf ? (
                            <iframe 
                                src={`/static/uploads/${selectedDoc.filename}`}
                                className="pdf-viewer-iframe"
                                title={selectedDoc.filename}
                            />
                        ) : isImg ? (
                            <div className="pdf-viewer-image-container">
                                <img 
                                    src={`/static/uploads/${selectedDoc.filename}`}
                                    className="pdf-viewer-image"
                                    alt={selectedDoc.filename}
                                />
                            </div>
                        ) : (
                            <div className="pdf-viewer-fallback">
                                <i className="ri-file-download-line" />
                                <h4 className="pdf-viewer-fallback-title">{selectedDoc.filename}</h4>
                                <p>Este arquivo não pode ser visualizado diretamente no navegador.</p>
                                <a 
                                    href={`/static/uploads/${selectedDoc.filename}`} 
                                    download={selectedDoc.filename}
                                    className="pdf-viewer-download-btn"
                                >
                                    <i className="ri-download-cloud-2-line" />
                                    Baixar Arquivo
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Navigation (only if multiple documents) */}
                {documents.length > 1 && (
                    <div className="pdf-viewer-footer">
                        <button 
                            className="pdf-viewer-nav-btn"
                            disabled={currentIndex === 0}
                            onClick={() => setSelectedDoc(documents[currentIndex - 1])}
                        >
                            <i className="ri-arrow-left-s-line" />
                            <span>Anterior</span>
                        </button>
                        <span className="pdf-viewer-counter">
                            {currentIndex + 1} de {documents.length}
                        </span>
                        <button 
                            className="pdf-viewer-nav-btn"
                            disabled={currentIndex === documents.length - 1}
                            onClick={() => setSelectedDoc(documents[currentIndex + 1])}
                        >
                            <span>Próximo</span>
                            <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
