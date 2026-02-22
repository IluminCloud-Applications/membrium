import type { MemberLessonDetail } from "@/types/member";
import { LessonFAQ } from "./LessonFAQ";
import { LessonDocuments } from "./LessonDocuments";

interface LessonContentProps {
    lesson: MemberLessonDetail;
}

export function LessonContent({ lesson }: LessonContentProps) {
    if (!lesson.description && lesson.documents.length === 0 && lesson.faqs.length === 0) {
        return null;
    }

    return (
        <div className="lesson-content-area">
            {/* Description */}
            {lesson.description && (
                <section className="lesson-description-card">
                    <div className="lesson-card-header">
                        <i className="ri-book-open-line" />
                        <h3>Descrição</h3>
                    </div>
                    <div
                        className="lesson-description-body"
                        dangerouslySetInnerHTML={{ __html: lesson.description }}
                    />
                </section>
            )}

            {/* Documents / Attachments */}
            {lesson.documents.length > 0 && (
                <LessonDocuments documents={lesson.documents} />
            )}

            {/* FAQ */}
            {lesson.faqs.length > 0 && (
                <LessonFAQ faqs={lesson.faqs} />
            )}
        </div>
    );
}
