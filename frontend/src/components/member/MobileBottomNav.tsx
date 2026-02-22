import { useLocation } from "react-router-dom";

interface MobileBottomNavProps {
    onSearchClick: () => void;
}

export function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
    const location = useLocation();
    const currentPath = location.pathname;

    const items = [
        { icon: "ri-home-4-line", iconActive: "ri-home-4-fill", label: "Início", href: "/member", match: "/member" },
        { icon: "ri-search-line", iconActive: "ri-search-fill", label: "Buscar", action: onSearchClick },
        { icon: "ri-user-line", iconActive: "ri-user-fill", label: "Perfil", href: "/member/perfil", match: "/member/perfil" },
    ];

    return (
        <nav className="member-bottom-nav">
            {items.map((item) => {
                const isActive = item.match
                    ? currentPath === item.match || (item.match === "/member" && currentPath === "/member")
                    : false;

                if (item.action) {
                    return (
                        <button
                            key={item.label}
                            className="member-bottom-nav-item"
                            onClick={item.action}
                        >
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </button>
                    );
                }

                return (
                    <a
                        key={item.label}
                        href={item.href}
                        className={`member-bottom-nav-item ${isActive ? "member-bottom-nav-active" : ""}`}
                    >
                        <i className={isActive ? item.iconActive : item.icon} />
                        <span>{item.label}</span>
                    </a>
                );
            })}
        </nav>
    );
}
