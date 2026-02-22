import { useState } from "react";
import { memberService } from "@/services/member";

interface ProfileFormProps {
    name: string;
    email: string;
    phone: string;
    onNameChange: (name: string) => void;
    onPhoneChange: (phone: string) => void;
}

export function ProfileForm({ name, email, phone, onNameChange, onPhoneChange }: ProfileFormProps) {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setMessage({ type: "error", text: "Nome é obrigatório" });
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            await memberService.updateProfile({ name: name.trim(), phone: phone.trim() });
            setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
        } catch {
            setMessage({ type: "error", text: "Erro ao atualizar perfil" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="member-profile-card" onSubmit={handleSubmit}>
            <h2 className="member-profile-card-title">
                <i className="ri-user-line" />
                Dados Pessoais
            </h2>

            <div className="member-profile-field">
                <label className="member-profile-label">Nome</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="member-profile-input"
                    placeholder="Seu nome"
                />
            </div>

            <div className="member-profile-field">
                <label className="member-profile-label">Email</label>
                <input
                    type="email"
                    value={email}
                    disabled
                    className="member-profile-input member-profile-input-disabled"
                />
                <span className="member-profile-hint">O email não pode ser alterado</span>
            </div>

            <div className="member-profile-field">
                <label className="member-profile-label">Celular</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    className="member-profile-input"
                    placeholder="(00) 00000-0000"
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
                        <i className="ri-save-line" />
                        Salvar alterações
                    </>
                )}
            </button>
        </form>
    );
}
