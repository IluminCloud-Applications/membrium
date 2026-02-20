import { useLocation, Link } from "react-router-dom";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "./sidebar-data";

interface NavGroupProps {
    label: string;
    items: NavItem[];
}

export function NavGroup({ label, items }: NavGroupProps) {
    const location = useLocation();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = location.pathname === item.url;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.title}
                            >
                                <Link to={item.url}>
                                    <i
                                        className={`${item.icon} text-base`}
                                        style={isActive ? { color: "oklch(0.53 0.22 25)" } : {}}
                                    />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
