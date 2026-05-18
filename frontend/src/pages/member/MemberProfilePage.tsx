import { useState, useEffect } from "react";
import { memberService } from "@/services/member";
import { customizationService } from "@/services/customization";
import { authService } from "@/services/authService";
import { MemberHeader } from "@/components/member";
import { ChatWidget } from "@/components/member/chatbot";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { SupportCard } from "./SupportCard";
import type { MemberMenuItem } from "@/types/member";

export function MemberProfilePage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    async function handleLogout() {
        try { await authService.logout(); } catch { /* ignore */ }
        window.location.href = "/login";
    }
    const [phone, setPhone] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");
    const [supportEmail, setSupportEmail] = useState("");
    const [supportWhatsapp, setSupportWhatsapp] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
        customizationService.getMemberConfig()
            .then((d) => injectMemberCss(d.member_custom_css || ""))
            .catch(() => {});
    }, []);

    async function loadProfile() {
        try {
            const profile = await memberService.getProfile();
            setName(profile.name);
            setEmail(profile.email);
            setPhone(profile.phone || "");
            setPlatformName(profile.platformName);
            setSupportEmail(profile.supportEmail || "");
            setSupportWhatsapp(profile.supportWhatsapp || "");
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
        } finally {
            setLoading(false);
        }
    }

    // "Início" highlighted link always present
    const menuItems: MemberMenuItem[] = [
        { name: "Início", url: "/member", order: 0 },
    ];

    if (loading) {
        return (
            <div className="member-page">
                <MemberHeader
                    platformName={platformName}
                    studentName="..."
                    menuItems={menuItems}
                />
                <div className="member-profile-wrapper">
                    <div className="member-profile-skeleton">
                        <div className="skeleton-text" style={{ width: "100%", height: 44 }} />
                        <div className="skeleton-text" style={{ width: "100%", height: 44, marginTop: 16 }} />
                        <div className="skeleton-text" style={{ width: "100%", height: 44, marginTop: 16 }} />
                    </div>
                    <div className="member-profile-skeleton">
                        <div className="skeleton-text" style={{ width: "100%", height: 44 }} />
                        <div className="skeleton-text" style={{ width: "100%", height: 44, marginTop: 16 }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="member-page">
            <MemberHeader
                platformName={platformName}
                studentName={name}
                menuItems={menuItems}
            />

            {/* Page title */}
            <div className="member-profile-header">
                <div className="member-profile-avatar-small">
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="member-profile-title">Meu Perfil</h1>
                    <p className="member-profile-email">{email}</p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="member-profile-wrapper">
                <ProfileForm
                    name={name}
                    email={email}
                    phone={phone}
                    onNameChange={setName}
                    onPhoneChange={setPhone}
                />
                <PasswordForm />
            </div>

            {/* Support card */}
            <div className="member-profile-support-wrapper">
                <SupportCard
                    supportEmail={supportEmail}
                    supportWhatsapp={supportWhatsapp}
                />
            </div>

            {/* Mobile-only logout button */}
            <div className="member-profile-logout-wrapper">
                <button className="member-profile-logout-btn" onClick={handleLogout}>
                    <i className="ri-logout-box-r-line" />
                    Sair da conta
                </button>
            </div>

            <ChatWidget />
        </div>
    );
}

function injectMemberCss(css: string) {
    const id = "member-custom-css";
    document.getElementById(id)?.remove();
    if (!css.trim()) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
