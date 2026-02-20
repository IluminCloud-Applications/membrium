import { useLocation, Link } from "react-router-dom";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "./sidebar-data";

interface NavBottomProps {
    items: NavItem[];
    onLogout: () => void;
}

export function NavBottom({ items, onLogout }: NavBottomProps) {
    const location = useLocation();

    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => {
                    const isExternal = item.url.startsWith("http");
                    const isActive = location.pathname === item.url;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.title}
                            >
                                {isExternal ? (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <i className={`${item.icon} text-base`} />
                                        <span>{item.title}</span>
                                    </a>
                                ) : (
                                    <Link to={item.url}>
                                        <i
                                            className={`${item.icon} text-base`}
                                            style={isActive ? { color: "oklch(0.53 0.22 25)" } : {}}
                                        />
                                        <span>{item.title}</span>
                                    </Link>
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}

                {/* Logout */}
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sair" onClick={onLogout}>
                        <i className="ri-logout-box-r-line text-base" />
                        <span>Sair</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
