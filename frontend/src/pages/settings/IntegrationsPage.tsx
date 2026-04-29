import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/settings";
import { BrevoTab } from "@/components/settings/integrations/BrevoTab";
import { EvolutionTab } from "@/components/settings/integrations/EvolutionTab";
import { YouTubeTab } from "@/components/settings/integrations/YouTubeTab";
import { VTurbTab } from "@/components/settings/integrations/VTurbTab";
import { CloudflareR2Tab } from "@/components/settings/integrations/CloudflareR2Tab";
import { ProxyTab } from "@/components/settings/integrations/ProxyTab";
import { ChatwootTab } from "@/components/settings/integrations/ChatwootTab";
import { AssemblyAITab } from "@/components/settings/integrations/AssemblyAITab";
import { AIIntegrationSection } from "@/components/settings/ai/AIIntegrationSection";

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

            <Tabs defaultValue="messaging" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="messaging" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-send-plane-line" />
                        Envio de Mensagens
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-film-line" />
                        Player de Vídeo
                    </TabsTrigger>
                    <TabsTrigger value="support" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-customer-service-2-line" />
                        Suporte
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-tools-line" />
                        Ferramentas
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-sparkling-line" />
                        Inteligência Artificial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messaging" className="mt-4 space-y-3">
                    <BrevoTab />
                    <EvolutionTab />
                </TabsContent>

                <TabsContent value="video" className="mt-4 space-y-3">
                    <YouTubeTab />
                    <VTurbTab />
                    <CloudflareR2Tab />
                </TabsContent>

                <TabsContent value="support" className="mt-4 space-y-3">
                    <ChatwootTab />
                </TabsContent>

                <TabsContent value="tools" className="mt-4 space-y-3">
                    <ProxyTab />
                    <AssemblyAITab />
                </TabsContent>

                {/* Shared with AI Settings page — same routes & state */}
                <TabsContent value="ai" className="mt-4">
                    <AIIntegrationSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
