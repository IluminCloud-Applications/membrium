import { useState, useEffect } from "react";
import { memberService } from "@/services/member";
import { MemberHeader } from "@/components/member";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import type { MemberMenuItem } from "@/types/member";

export function MemberProfilePage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [platformName, setPlatformName] = useState("Área de Membros");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const profile = await memberService.getProfile();
            setName(profile.name);
            setEmail(profile.email);
            setPhone(profile.phone || "");
            setPlatformName(profile.platformName);
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
        </div>
    );
}
