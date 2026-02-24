import { SettingsHeader } from "@/components/settings";
import { LoginCustomizationSection } from "./login/LoginCustomizationSection";

export function CustomizationPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-palette-line"
                title="Personalização"
                description="Personalize a aparência da sua plataforma."
            />

            {/* Login page customization */}
            <LoginCustomizationSection />

            {/* Future: Member area customization placeholder */}
        </div>
    );
}
