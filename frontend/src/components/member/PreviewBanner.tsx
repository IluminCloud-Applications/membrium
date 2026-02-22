/**
 * Floating banner shown at the top of the member area when in admin preview mode.
 * Indicates the admin is viewing the platform as a student would see it.
 */
export function PreviewBanner() {
    return (
        <div className="preview-banner">
            <div className="preview-banner-inner">
                <i className="ri-eye-line" />
                <span>Modo Preview — Você está visualizando como aluno</span>
                <button
                    className="preview-banner-close"
                    onClick={() => {
                        window.close();
                        // Fallback: navigate to admin if window.close doesn't work
                        setTimeout(() => {
                            window.location.href = "/admin/cursos";
                        }, 200);
                    }}
                >
                    <i className="ri-close-line" />
                    Fechar Preview
                </button>
            </div>
        </div>
    );
}
