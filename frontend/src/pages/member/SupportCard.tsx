interface SupportCardProps {
    supportEmail: string;
    supportWhatsapp: string;
}

export function SupportCard({ supportEmail, supportWhatsapp }: SupportCardProps) {
    const hasAny = supportEmail || supportWhatsapp;

    if (!hasAny) return null;

    function formatWhatsappLink(phone: string): string {
        const digits = phone.replace(/\D/g, "");
        return `https://wa.me/${digits}`;
    }

    function formatPhoneDisplay(phone: string): string {
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 13) {
            // +55 11 99999-9999
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
        }
        if (digits.length === 11) {
            // (11) 99999-9999
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        return phone;
    }

    return (
        <div className="member-profile-card member-support-card">
            <h2 className="member-profile-card-title">
                <i className="ri-customer-service-2-line" />
                Suporte
            </h2>

            <p className="member-support-description">
                Precisa de ajuda? Entre em contato com nosso suporte:
            </p>

            <div className="member-support-channels">
                {supportEmail && (
                    <a
                        href={`mailto:${supportEmail}`}
                        className="member-support-channel"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div className="member-support-channel-icon member-support-channel-email">
                            <i className="ri-mail-line" />
                        </div>
                        <div className="member-support-channel-info">
                            <span className="member-support-channel-label">Email</span>
                            <span className="member-support-channel-value">{supportEmail}</span>
                        </div>
                        <i className="ri-external-link-line member-support-channel-arrow" />
                    </a>
                )}

                {supportWhatsapp && (
                    <a
                        href={formatWhatsappLink(supportWhatsapp)}
                        className="member-support-channel"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div className="member-support-channel-icon member-support-channel-whatsapp">
                            <i className="ri-whatsapp-line" />
                        </div>
                        <div className="member-support-channel-info">
                            <span className="member-support-channel-label">WhatsApp</span>
                            <span className="member-support-channel-value">
                                {formatPhoneDisplay(supportWhatsapp)}
                            </span>
                        </div>
                        <i className="ri-external-link-line member-support-channel-arrow" />
                    </a>
                )}
            </div>
        </div>
    );
}
