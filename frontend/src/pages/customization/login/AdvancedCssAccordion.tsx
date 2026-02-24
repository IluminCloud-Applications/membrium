import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";

interface AdvancedCssAccordionProps {
    value: string;
    onChange: (css: string) => void;
}

export function AdvancedCssAccordion({ value, onChange }: AdvancedCssAccordionProps) {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="css" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground py-3">
                    <span className="flex items-center gap-2">
                        <i className="ri-code-s-slash-line" />
                        CSS Personalizado
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2 pb-2">
                        <Textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`.auth-layout {\n  /* seus estilos aqui */\n}`}
                            rows={6}
                            className="font-mono text-xs resize-y"
                        />
                        <p className="text-xs text-muted-foreground">
                            CSS avançado aplicado na página de login. Use com cuidado.
                        </p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
