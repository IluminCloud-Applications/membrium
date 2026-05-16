import { useState } from "react";
import type { MemberLessonDetail, MemberLessonDocument, MemberLessonFAQ } from "@/types/member";

interface LessonContentProps {
    lesson: MemberLessonDetail;
    onViewDocument?: (doc: MemberLessonDocument) => void;
}

export function LessonContent({ lesson, onViewDocument }: LessonContentProps) {
    const documents = lesson.documents ?? [];
    const faqs = lesson.faqs ?? [];

    const hasContent = lesson.description || documents.length > 0 || faqs.length > 0;
    if (!hasContent) return null;

    return (
        <div className="lesson-content-area">

            {/* Description */}
            {lesson.description && (
                <div className="lesson-section">
                    <div
                        className="lesson-description-body"
                        dangerouslySetInnerHTML={{ __html: lesson.description }}
                    />
                </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
                <div className="lesson-section">
                    {lesson.description && <div className="lesson-section-divider" />}
                    <p className="lesson-section-label">
                        <i className="ri-attachment-2" />
                        Material Complementar
                    </p>
                    <div className="lesson-documents-list">
                        {documents.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} onViewDocument={onViewDocument} />
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
                <div className="lesson-section">
                    {(lesson.description || documents.length > 0) && <div className="lesson-section-divider" />}
                    <p className="lesson-section-label">
                        <i className="ri-question-line" />
                        Perguntas Frequentes
                    </p>
                    <div className="lesson-faq-list">
                        {faqs.map((faq, index) => (
                            <FAQItem key={faq.id} faq={faq} index={index} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Document row ---- */
function DocumentRow({ doc, onViewDocument }: { doc: MemberLessonDocument, onViewDocument?: (doc: MemberLessonDocument) => void }) {
    return (
        <div className="lesson-document-item">
            <div className="lesson-document-info">
                <i className="ri-file-text-line" />
                <span className="lesson-document-name">{doc.filename}</span>
            </div>
            <div className="lesson-document-actions">
                {onViewDocument ? (
                    <button
                        onClick={() => onViewDocument(doc)}
                        className="lesson-doc-btn lesson-doc-btn-view"
                        title="Visualizar"
                    >
                        <i className="ri-eye-line" />
                    </button>
                ) : (
                    <a
                        href={`/static/uploads/${doc.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lesson-doc-btn lesson-doc-btn-view"
                        title="Visualizar"
                    >
                        <i className="ri-eye-line" />
                    </a>
                )}
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
    );
}

/* ---- FAQ accordion item ---- */
function FAQItem({ faq, index }: { faq: MemberLessonFAQ; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`lesson-faq-item ${open ? "lesson-faq-item-open" : ""}`}>
            <button className="lesson-faq-question" onClick={() => setOpen((v) => !v)}>
                <div className="lesson-faq-number">{index + 1}</div>
                <span>{faq.question}</span>
                <i className={`ri-arrow-down-s-line lesson-faq-chevron ${open ? "lesson-faq-chevron-open" : ""}`} />
            </button>
            {open && (
                <div className="lesson-faq-answer">
                    <p>{faq.answer}</p>
                </div>
            )}
        </div>
    );
}
