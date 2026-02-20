import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/settings";
import { ChatbotTab } from "@/components/settings/ai/ChatbotTab";
import { AIApiTab } from "@/components/settings/ai/AIApiTab";

export function AIPage() {
    // TODO: In real app, pull from global state / API
    const [hasApiConfigured] = useState(false);

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-sparkling-line"
                title="Inteligência Artificial"
                description="Configure os provedores de IA e o chatbot de suporte."
            />

            <Tabs defaultValue="chatbot" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="chatbot" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-robot-2-line" />
                        Chatbot
                    </TabsTrigger>
                    <TabsTrigger value="api" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-key-2-line" />
                        API
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="chatbot" className="mt-4">
                    {!hasApiConfigured && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 mb-6">
                            <i className="ri-alert-line text-amber-500 text-lg mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                    Nenhuma API de IA configurada
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                    Para utilizar o Chatbot, configure pelo menos um provedor de IA na aba{" "}
                                    <button
                                        type="button"
                                        className="underline font-medium hover:text-amber-800"
                                        onClick={() => {
                                            // Switch to API tab
                                            const apiTab = document.querySelector<HTMLButtonElement>(
                                                '[data-state][value="api"]'
                                            );
                                            apiTab?.click();
                                        }}
                                    >
                                        API
                                    </button>.
                                </p>
                            </div>
                        </div>
                    )}
                    <ChatbotTab />
                </TabsContent>

                <TabsContent value="api" className="mt-4">
                    <AIApiTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
