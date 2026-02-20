import type {
    FAQLessonGroup,
    FAQCourse,
    FAQModule,
    FAQLesson,
} from "@/types/faq";

export const mockCourses: FAQCourse[] = [
    { id: 1, name: "Marketing Digital Completo" },
    { id: 2, name: "Copywriting Avançado" },
    { id: 3, name: "Tráfego Pago" },
];

export const mockModules: FAQModule[] = [
    { id: 1, name: "Introdução", courseId: 1 },
    { id: 2, name: "Estratégias de Conteúdo", courseId: 1 },
    { id: 3, name: "Fundamentos da Copy", courseId: 2 },
    { id: 4, name: "Headlines com IA", courseId: 2 },
    { id: 5, name: "Facebook Ads", courseId: 3 },
];

export const mockLessons: FAQLesson[] = [
    { id: 1, name: "Boas-vindas ao Curso", moduleId: 1 },
    { id: 2, name: "O que é Marketing Digital?", moduleId: 1 },
    { id: 3, name: "Criando Conteúdo Viral", moduleId: 2 },
    { id: 4, name: "O Poder das Palavras", moduleId: 3 },
    { id: 5, name: "Headlines que Convertem", moduleId: 4 },
    { id: 6, name: "Configurando sua Primeira Campanha", moduleId: 5 },
];

export const mockFAQGroups: FAQLessonGroup[] = [
    {
        lessonId: 1,
        lessonName: "Boas-vindas ao Curso",
        moduleId: 1,
        moduleName: "Introdução",
        courseId: 1,
        courseName: "Marketing Digital Completo",
        faqs: [
            { id: 1, question: "Como funciona a área de membros?", answer: "A área de membros funciona como uma Netflix: você tem acesso a todos os módulos e aulas do curso, podendo assistir no seu próprio ritmo." },
            { id: 2, question: "Posso assistir no celular?", answer: "Sim! A plataforma é 100% responsiva e funciona perfeitamente em smartphones, tablets e computadores." },
            { id: 3, question: "Por quanto tempo tenho acesso?", answer: "Seu acesso é vitalício! Uma vez inscrito, você pode acessar o conteúdo sempre que quiser." },
        ],
        updatedAt: "2026-02-18",
    },
    {
        lessonId: 3,
        lessonName: "Criando Conteúdo Viral",
        moduleId: 2,
        moduleName: "Estratégias de Conteúdo",
        courseId: 1,
        courseName: "Marketing Digital Completo",
        faqs: [
            { id: 4, question: "Preciso de equipamentos caros para criar conteúdo?", answer: "Não! Você pode começar apenas com seu smartphone. Na aula, mostramos técnicas que funcionam com qualquer equipamento." },
            { id: 5, question: "Quanto tempo leva para um conteúdo viralizar?", answer: "Não existe uma fórmula exata, mas aplicando as técnicas ensinadas, você aumentará significativamente suas chances. Alguns alunos relatam resultados em poucos dias." },
        ],
        updatedAt: "2026-02-19",
    },
    {
        lessonId: 4,
        lessonName: "O Poder das Palavras",
        moduleId: 3,
        moduleName: "Fundamentos da Copy",
        courseId: 2,
        courseName: "Copywriting Avançado",
        faqs: [
            { id: 6, question: "Preciso saber escrever bem para fazer copy?", answer: "Não necessariamente! Copywriting é uma habilidade técnica que pode ser aprendida. Você vai aprender fórmulas e estruturas que facilitam todo o processo." },
            { id: 7, question: "Copy funciona para qualquer nicho?", answer: "Sim! Os princípios de persuasão são universais. Mostramos exemplos em diversos nichos para que você possa adaptar ao seu mercado." },
            { id: 8, question: "Qual a diferença entre copy e redação publicitária?", answer: "Copy é focada em gerar uma ação direta do leitor (compra, cadastro, clique), enquanto a redação publicitária pode ter objetivos mais amplos como branding." },
        ],
        updatedAt: "2026-02-20",
    },
    {
        lessonId: 5,
        lessonName: "Headlines que Convertem",
        moduleId: 4,
        moduleName: "Headlines com IA",
        courseId: 2,
        courseName: "Copywriting Avançado",
        faqs: [
            { id: 9, question: "A IA pode substituir o copywriter?", answer: "A IA é uma ferramenta poderosa, mas funciona melhor como assistente. Na aula, mostramos como usar a IA para potencializar sua criatividade, não substituí-la." },
            { id: 10, question: "Quais ferramentas de IA são recomendadas?", answer: "Recomendamos ChatGPT e Gemini para geração de headlines. Na aula, mostramos prompts específicos para obter os melhores resultados." },
        ],
        updatedAt: "2026-02-20",
    },
    {
        lessonId: 6,
        lessonName: "Configurando sua Primeira Campanha",
        moduleId: 5,
        moduleName: "Facebook Ads",
        courseId: 3,
        courseName: "Tráfego Pago",
        faqs: [
            { id: 11, question: "Qual o investimento mínimo em anúncios?", answer: "Recomendamos começar com pelo menos R$ 20/dia para ter dados suficientes para otimização. Mas é possível iniciar com menos." },
            { id: 12, question: "Minha conta de anúncios foi bloqueada, o que fazer?", answer: "Na aula de bônus, abordamos estratégias para recuperar contas bloqueadas e como evitar bloqueios futuros." },
        ],
        updatedAt: "2026-02-19",
    },
];
