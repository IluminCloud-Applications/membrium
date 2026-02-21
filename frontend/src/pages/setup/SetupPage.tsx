import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SetupStepPlatform } from "./SetupStepPlatform";
import { SetupStepAdmin } from "./SetupStepAdmin";
import { SetupStepDone } from "./SetupStepDone";
import { StepIndicator } from "./StepIndicator";

export type SetupData = {
    platform_name: string;
    name: string;
    email: string;
    password: string;
};

interface SetupPageProps {
    onSetupComplete: () => void;
}

const STEP_SUBTITLES = [
    "Escolha o nome que seus alunos verão",
    "Configure o acesso do administrador",
    "Sua plataforma foi configurada com sucesso",
];

export function SetupPage({ onSetupComplete }: SetupPageProps) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<SetupData>({
        platform_name: "",
        name: "",
        email: "",
        password: "",
    });

    return (
        <AuthLayout>
            <div className="auth-card">
                {/* Logo + Title — outside the card */}
                <div className="text-center mb-6">
                    <img
                        src="/logo.webp"
                        alt="Membrium"
                        className="h-10 w-auto mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold tracking-tight">
                        Configuração Inicial
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {STEP_SUBTITLES[step]}
                    </p>
                </div>

                <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <CardContent className="p-8">
                        <StepIndicator
                            currentStep={step}
                            steps={["Plataforma", "Admin", "Pronto!"]}
                        />

                        <div className="animate-fade-in" key={step}>
                            {step === 0 && (
                                <SetupStepPlatform
                                    value={data.platform_name}
                                    onNext={(name: string) => {
                                        setData((prev) => ({ ...prev, platform_name: name }));
                                        setStep(1);
                                    }}
                                />
                            )}

                            {step === 1 && (
                                <SetupStepAdmin
                                    data={data}
                                    onBack={() => setStep(0)}
                                    onComplete={(name: string, email: string, password: string) => {
                                        setData((prev) => ({ ...prev, name, email, password }));
                                        setStep(2);
                                    }}
                                />
                            )}

                            {step === 2 && (
                                <SetupStepDone onGoToLogin={onSetupComplete} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
