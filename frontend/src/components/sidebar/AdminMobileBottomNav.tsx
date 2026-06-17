import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const allMainItems = [
    { title: "Dashboard", url: "/admin", icon: "ri-dashboard-3-line", iconActive: "ri-dashboard-3-fill" },
    { title: "Cursos", url: "/admin/cursos", icon: "ri-book-open-line", iconActive: "ri-book-open-fill", adminOnly: true },
    { title: "Alunos", url: "/admin/alunos", icon: "ri-group-line", iconActive: "ri-group-fill" },
];

const allRecursosItems = [
    { title: "Vitrine", url: "/admin/vitrine", icon: "ri-store-2-line", adminOnly: true },
    { title: "Promoções", url: "/admin/promocoes", icon: "ri-megaphone-line", adminOnly: true },
    { title: "FAQ", url: "/admin/faq", icon: "ri-question-answer-line" },
];

interface AdminMobileBottomNavProps {
    userRole?: string;
}

export function AdminMobileBottomNav({ userRole = 'admin' }: AdminMobileBottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const [recursosOpen, setRecursosOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isSupport = userRole === 'support';

    const mainItems = useMemo(
        () => allMainItems.filter((i) => !isSupport || !i.adminOnly),
        [isSupport]
    );

    const recursosItems = useMemo(
        () => allRecursosItems.filter((i) => !isSupport || !i.adminOnly),
        [isSupport]
    );

    const isRecursosActive = recursosItems.some((i) => currentPath.startsWith(i.url));
    const isItemActive = (url: string) =>
        url === "/admin" ? currentPath === "/admin" : currentPath.startsWith(url);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setRecursosOpen(false);
            }
        }
        if (recursosOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [recursosOpen]);

    function handleNavigate(url: string) {
        navigate(url);
        setRecursosOpen(false);
    }

    return (
        <nav className="admin-bottom-nav" aria-label="Navegação mobile admin">
            {mainItems.map((item) => {
                const active = isItemActive(item.url);
                return (
                    <a
                        key={item.url}
                        href={item.url}
                        onClick={(e) => { e.preventDefault(); navigate(item.url); }}
                        className={`admin-bottom-nav-item ${active ? "admin-bottom-nav-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                    >
                        <i className={active ? item.iconActive : item.icon} />
                        <span>{item.title}</span>
                    </a>
                );
            })}

            {/* Recursos with dropdown — only show if there are items */}
            {recursosItems.length > 0 && (
                <div className="admin-bottom-nav-recursos" ref={dropdownRef}>
                    {recursosOpen && (
                        <div className="admin-bottom-nav-dropdown admin-bottom-nav-dropdown--right">
                            {recursosItems.map((item) => (
                                <button
                                    key={item.url}
                                    className={`admin-bottom-nav-dropdown-item ${currentPath.startsWith(item.url) ? "admin-bottom-nav-dropdown-active" : ""}`}
                                    onClick={() => handleNavigate(item.url)}
                                >
                                    <i className={item.icon} />
                                    <span>{item.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        className={`admin-bottom-nav-item ${isRecursosActive || recursosOpen ? "admin-bottom-nav-active" : ""}`}
                        onClick={() => setRecursosOpen((prev) => !prev)}
                        aria-expanded={recursosOpen}
                    >
                        <i className={recursosOpen || isRecursosActive ? "ri-apps-fill" : "ri-apps-line"} />
                        <span>Recursos</span>
                    </button>
                </div>
            )}
        </nav>
    );
}
