import { useState } from "react";
import type { MemberLessonFAQ } from "@/types/member";

interface LessonFAQProps {
    faqs: MemberLessonFAQ[];
}

export function LessonFAQ({ faqs }: LessonFAQProps) {
    const [openId, setOpenId] = useState<number | null>(null);

    function toggleFAQ(id: number) {
        setOpenId((prev) => (prev === id ? null : id));
    }

    return (
        <section className="lesson-faq-card">
            <div className="lesson-card-header">
                <i className="ri-question-line" />
                <h3>Perguntas Frequentes</h3>
            </div>

            <div className="lesson-faq-list">
                {faqs.map((faq, index) => {
                    const isOpen = openId === faq.id;
                    return (
                        <div
                            key={faq.id}
                            className={`lesson-faq-item ${isOpen ? "lesson-faq-item-open" : ""}`}
                        >
                            <button
                                className="lesson-faq-question"
                                onClick={() => toggleFAQ(faq.id)}
                            >
                                <div className="lesson-faq-number">{index + 1}</div>
                                <span>{faq.question}</span>
                                <i className={`ri-arrow-down-s-line lesson-faq-chevron ${isOpen ? "lesson-faq-chevron-open" : ""}`} />
                            </button>
                            {isOpen && (
                                <div className="lesson-faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
