import { useLocation } from "react-router-dom";
import type { MemberMenuItem } from "@/types/member";

interface MobileBottomNavProps {
    onSearchClick: () => void;
    menuItems: MemberMenuItem[];
}

export function MobileBottomNav({ onSearchClick, menuItems }: MobileBottomNavProps) {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <nav className="member-bottom-nav">
            {/* Início */}
            <a
                href="/member"
                className={`member-bottom-nav-item ${currentPath === "/member" ? "member-bottom-nav-active" : ""}`}
            >
                <i className={currentPath === "/member" ? "ri-home-4-fill" : "ri-home-4-line"} />
                <span>Início</span>
            </a>

            {/* Dynamic menu items from API */}
            {menuItems.map((item, i) => (
                <a
                    key={i}
                    href={item.url}
                    target={item.url.startsWith("http") ? "_blank" : undefined}
                    rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="member-bottom-nav-item"
                >
                    <i className={item.icon || "ri-links-line"} />
                    <span>{item.name}</span>
                </a>
            ))}

            {/* Buscar */}
            <button
                className="member-bottom-nav-item"
                onClick={onSearchClick}
            >
                <i className="ri-search-line" />
                <span>Buscar</span>
            </button>

            {/* Perfil */}
            <a
                href="/member/perfil"
                className={`member-bottom-nav-item ${currentPath === "/member/perfil" ? "member-bottom-nav-active" : ""}`}
            >
                <i className={currentPath === "/member/perfil" ? "ri-user-fill" : "ri-user-line"} />
                <span>Perfil</span>
            </a>
        </nav>
    );
}
