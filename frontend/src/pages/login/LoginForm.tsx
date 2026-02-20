import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormAlert } from "@/components/auth/FormAlert";
import { useForm } from "@/hooks/useForm";
import { authService } from "@/services/authService";

interface LoginFormProps {
    onForgotPassword: () => void;
}

type LoginFormValues = {
    email: string;
    password: string;
};

export function LoginForm({ onForgotPassword }: LoginFormProps) {
    const { values, isLoading, error, handleChange, handleSubmit } =
        useForm<LoginFormValues>({
            initialValues: { email: "", password: "" },
            onSubmit: async (formValues) => {
                const response = await authService.login(formValues);

                if (!response.success) {
                    throw new Error(response.message);
                }

                // Redirect based on user type
                if (response.user?.type === "admin") {
                    window.location.href = "/admin";
                } else {
                    window.location.href = "/dashboard";
                }
            },
        });

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <FormAlert message={error} type="error" />

            <div className="form-group">
                <Label htmlFor="login-email" className="form-label">
                    E-mail
                </Label>
                <div className="input-with-icon">
                    <i className="ri-mail-line input-icon" />
                    <Input
                        id="login-email"
                        type="email"
                        value={values.email}
                        onChange={handleChange("email")}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        autoComplete="email"
                        autoFocus
                    />

                </div>
            </div>


            <PasswordInput
                id="login-password"
                label="Senha"
                value={values.password}
                onChange={handleChange("password")}
                autoComplete="current-password"
                labelRight={
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="auth-link text-xs"
                    >
                        Esqueceu a senha?
                    </button>
                }
            />


            <Button
                type="submit"
                className="btn-brand w-full h-11"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <i className="ri-loader-4-line animate-spin" />
                        Entrando...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <i className="ri-login-box-line" />
                        Entrar
                    </span>
                )}
            </Button>
        </form>
    );
}
