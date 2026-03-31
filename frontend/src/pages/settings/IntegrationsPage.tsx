import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/settings";
import { BrevoTab } from "@/components/settings/integrations/BrevoTab";
import { EvolutionTab } from "@/components/settings/integrations/EvolutionTab";
import { YouTubeTab } from "@/components/settings/integrations/YouTubeTab";
import { VTurbTab } from "@/components/settings/integrations/VTurbTab";
import { ProxyTab } from "@/components/settings/integrations/ProxyTab";

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
                    uma opção (Email ou WhatsApp) para notificar seus alunos.
                </p>
            </div>

            <Tabs defaultValue="brevo" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="brevo" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-mail-send-line" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="evolution" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-whatsapp-line" />
                        WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-youtube-line" />
                        YouTube
                    </TabsTrigger>
                    <TabsTrigger value="vturb" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-play-circle-line" />
                        VTurb
                    </TabsTrigger>
                    <TabsTrigger value="proxy" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-shield-keyhole-line" />
                        Proxy
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
                <TabsContent value="vturb" className="mt-4">
                    <VTurbTab />
                </TabsContent>
                <TabsContent value="proxy" className="mt-4">
                    <ProxyTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
