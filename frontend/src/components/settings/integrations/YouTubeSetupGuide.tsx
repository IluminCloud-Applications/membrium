import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const SETUP_STEPS = [
    {
        id: "step-1",
        title: "Ativar a YouTube Data API v3",
        content: [
            "Clique no link abaixo para ir direto à página da API:",
            "https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com",
            'Clique em "Ativar" e aguarde.',
            'Se não tiver um projeto, o Google pedirá para criar um — dê qualquer nome (ex: "Membrium").',
        ],
    },
    {
        id: "step-2",
        title: "Configurar Tela de Consentimento OAuth",
        content: [
            'Vá em "APIs e Serviços" → "Tela de consentimento OAuth".',
            'Tipo de usuário: selecione "Externo" → "Criar".',
            "Preencha apenas os campos obrigatórios (nome do app e emails) e avance.",
            'Na etapa "Escopos", não precisa adicionar nada — avance.',
            'Complete até "Salvar e continuar".',
        ],
    },
    {
        id: "step-3",
        title: "Criar Credenciais OAuth (Client ID e Secret)",
        content: [
            'Vá em "APIs e Serviços" → "Credenciais".',
            'Clique em "+ Criar Credenciais" → "ID do cliente OAuth".',
            'Tipo: "Aplicativo da Web".',
            'Em "Origens JavaScript autorizadas": adicione a URL do seu site (ex: https://seudominio.com).',
            'Em "URIs de redirecionamento autorizados": copie a URL abaixo e cole lá.',
            'Clique em "Criar" e copie o Client ID e Client Secret gerados.',
        ],
    },
    {
        id: "step-4",
        title: "Colar as credenciais aqui",
        content: [
            "Cole o Client ID e Client Secret nos campos abaixo e salve.",
            "Pronto! A integração estará ativa.",
        ],
    },
];

export function YouTubeSetupGuide() {
    return (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
                <i className="ri-book-open-line text-primary" />
                <h4 className="text-sm font-medium">
                    Como configurar (4 passos)
                </h4>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {SETUP_STEPS.map((step, index) => (
                    <AccordionItem key={step.id} value={step.id}>
                        <AccordionTrigger className="text-sm hover:no-underline">
                            <span className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                                    {index + 1}
                                </span>
                                {step.title}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="space-y-2 text-sm text-muted-foreground pl-8">
                                {step.content.map((line, i) => (
                                    <li key={i} className="leading-relaxed">
                                        {line.startsWith("http") ? (
                                            <a
                                                href={line}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline font-medium break-all"
                                            >
                                                {line}
                                            </a>
                                        ) : (
                                            line
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
