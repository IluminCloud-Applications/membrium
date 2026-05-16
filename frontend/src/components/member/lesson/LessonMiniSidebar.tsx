import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { MemberMenuItem } from "@/types/member";

interface LessonMiniSidebarProps {
    studentName?: string;
    menuItems?: MemberMenuItem[];
}

export function LessonMiniSidebar({ studentName, menuItems = [] }: LessonMiniSidebarProps) {
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const initial = studentName
        ? studentName.trim().charAt(0).toUpperCase()
        : "A";

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleLogout() {
        localStorage.clear();
        navigate("/login");
    }

    return (
        <aside className="lesson-mini-sidebar">
            {/* Home */}
            <a href="/member" className="lesson-mini-btn" title="Início">
                <i className="ri-home-5-line" />
            </a>

            {/* Search */}
            <a href="/member?search=1" className="lesson-mini-btn" title="Buscar">
                <i className="ri-search-line" />
            </a>

            {/* Extra menu items */}
            {menuItems.slice(0, 3).map((item) => (
                <a
                    key={item.name}
                    href={item.url || "#"}
                    className="lesson-mini-btn"
                    title={item.name}
                    target={item.url?.startsWith("http") ? "_blank" : undefined}
                    rel={item.url?.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                    <i className={item.icon || "ri-link"} />
                </a>
            ))}

            {/* Spacer */}
            <div className="lesson-mini-spacer" />

            {/* User avatar / menu */}
            <div className="lesson-mini-user-wrap" ref={menuRef}>
                <button
                    className="lesson-mini-avatar-btn"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    title={studentName || "Perfil"}
                >
                    <div className="lesson-mini-avatar">{initial}</div>
                </button>

                {userMenuOpen && (
                    <div className="lesson-mini-dropdown">
                        <div className="lesson-mini-dropdown-header">
                            <span className="lesson-mini-dropdown-name">{studentName || "Aluno"}</span>
                        </div>
                        <div className="lesson-mini-dropdown-divider" />
                        <a href="/member/profile" className="lesson-mini-dropdown-item">
                            <i className="ri-user-line" />
                            Meu perfil
                        </a>
                        <button
                            className="lesson-mini-dropdown-item lesson-mini-dropdown-danger"
                            onClick={handleLogout}
                        >
                            <i className="ri-logout-box-r-line" />
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
