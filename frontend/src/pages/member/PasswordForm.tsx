import { useState } from "react";
import { memberService } from "@/services/member";

export function PasswordForm() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);

        if (!newPassword || newPassword.length < 4) {
            setMessage({ type: "error", text: "A senha deve ter no mínimo 4 caracteres" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "As senhas não coincidem" });
            return;
        }

        setSaving(true);
        try {
            await memberService.updatePassword(newPassword);
            setMessage({ type: "success", text: "Senha alterada com sucesso!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setMessage({ type: "error", text: "Erro ao alterar senha" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="member-profile-card" onSubmit={handleSubmit}>
            <h2 className="member-profile-card-title">
                <i className="ri-lock-line" />
                Alterar Senha
            </h2>

            <div className="member-profile-field">
                <label className="member-profile-label">Nova Senha</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="member-profile-input"
                    placeholder="Digite a nova senha"
                    minLength={4}
                />
            </div>

            <div className="member-profile-field">
                <label className="member-profile-label">Repita a Senha</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="member-profile-input"
                    placeholder="Confirme a nova senha"
                    minLength={4}
                />
            </div>

            {message && (
                <div className={`member-profile-message member-profile-message-${message.type}`}>
                    <i className={message.type === "success" ? "ri-check-line" : "ri-error-warning-line"} />
                    {message.text}
                </div>
            )}

            <button type="submit" className="member-profile-btn" disabled={saving}>
                {saving ? (
                    <>
                        <i className="ri-loader-4-line animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <i className="ri-key-line" />
                        Alterar senha
                    </>
                )}
            </button>
        </form>
    );
}
