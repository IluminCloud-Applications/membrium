import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "./LoginForm";
import { ForgotPasswordModal } from "@/components/modals/auth/ForgotPasswordModal";

interface LoginPageProps {
    platformName: string;
}

export function LoginPage({ platformName }: LoginPageProps) {
    const [forgotOpen, setForgotOpen] = useState(false);

    return (
        <AuthLayout>
            <div className="auth-card">
                {/* Title — platform name only, no logo */}
                <div className="text-center mb-6">
                    <h1 className="platform-name">

                        {platformName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Faça login para acessar sua área de membros
                    </p>
                </div>

                <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <CardContent className="p-8">
                        <LoginForm
                            onForgotPassword={() => setForgotOpen(true)}
                        />
                    </CardContent>
                </Card>
            </div>

            <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
        </AuthLayout>
    );
}
