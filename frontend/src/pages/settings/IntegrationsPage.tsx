import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/settings";
import { BrevoTab } from "@/components/settings/integrations/BrevoTab";
import { EvolutionTab } from "@/components/settings/integrations/EvolutionTab";
import { YouTubeTab } from "@/components/settings/integrations/YouTubeTab";

export function IntegrationsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-plug-line"
                title="Integrações"
                description="Configure suas integrações com serviços externos."
            />

            {/* Alert */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
                <i className="ri-alert-line text-amber-500 text-lg mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                    A MembriumWL não dispara mensagens automaticamente. É necessário integrar ao menos
                    uma opção (Evolution API ou Brevo) para notificar seus alunos.
                </p>
            </div>

            <Tabs defaultValue="brevo" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="brevo" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-mail-send-line" />
                        Brevo
                    </TabsTrigger>
                    <TabsTrigger value="evolution" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-whatsapp-line" />
                        Evolution API
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-youtube-line" />
                        YouTube
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="brevo" className="mt-4">
                    <BrevoTab />
                </TabsContent>
                <TabsContent value="evolution" className="mt-4">
                    <EvolutionTab />
                </TabsContent>
                <TabsContent value="youtube" className="mt-4">
                    <YouTubeTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
