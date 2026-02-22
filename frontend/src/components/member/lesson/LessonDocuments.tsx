import type { MemberLessonDocument } from "@/types/member";

interface LessonDocumentsProps {
    documents: MemberLessonDocument[];
}

export function LessonDocuments({ documents }: LessonDocumentsProps) {
    return (
        <section className="lesson-documents-card">
            <div className="lesson-card-header">
                <i className="ri-attachment-2" />
                <h3>Material Complementar</h3>
            </div>

            <div className="lesson-documents-list">
                {documents.map((doc) => (
                    <div key={doc.id} className="lesson-document-item">
                        <div className="lesson-document-info">
                            <i className="ri-file-text-line" />
                            <span className="lesson-document-name">{doc.filename}</span>
                        </div>
                        <div className="lesson-document-actions">
                            <a
                                href={`/static/uploads/${doc.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lesson-doc-btn lesson-doc-btn-view"
                                title="Visualizar"
                            >
                                <i className="ri-eye-line" />
                            </a>
                            <a
                                href={`/static/uploads/${doc.filename}`}
                                download={doc.filename}
                                className="lesson-doc-btn lesson-doc-btn-download"
                                title="Baixar"
                            >
                                <i className="ri-download-line" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
