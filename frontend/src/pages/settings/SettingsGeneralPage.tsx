import { SettingsHeader } from "@/components/settings";
import { PlatformSection } from "@/components/settings/general/PlatformSection";
import { AdminSection } from "@/components/settings/general/AdminSection";
import { SupportEmailSection } from "@/components/settings/general/SupportEmailSection";
import { StudentSignupSection } from "@/components/settings/general/StudentSignupSection";

export function SettingsGeneralPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-settings-3-line"
                title="Configurações Gerais"
                description="Personalize sua plataforma e gerencie suas credenciais."
            />

            <PlatformSection />
            <AdminSection />
            <SupportEmailSection />
            <StudentSignupSection />
        </div>
    );
}
