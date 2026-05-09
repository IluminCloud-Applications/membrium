import { useState } from "react";
import { SettingsHeader } from "@/components/settings";
import { LoginCustomizationSection } from "./login/LoginCustomizationSection";
import { MemberCustomizationSection } from "./member/MemberCustomizationSection";
import { cn } from "@/lib/utils";

type PersonalizationTab = "login" | "member";

const TABS: { key: PersonalizationTab; label: string; icon: string }[] = [
    { key: "login", label: "Login", icon: "ri-lock-line" },
    { key: "member", label: "Área de Membros", icon: "ri-layout-2-line" },
];

export function CustomizationPage() {
    const [activeTab, setActiveTab] = useState<PersonalizationTab>("login");

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-palette-line"
                title="Personalização"
                description="Personalize a aparência da sua plataforma."
            />

            {/* Tab selector */}
            <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1 w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                            activeTab === tab.key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <i className={tab.icon} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "login" && <LoginCustomizationSection />}
            {activeTab === "member" && <MemberCustomizationSection />}
        </div>
    );
}
