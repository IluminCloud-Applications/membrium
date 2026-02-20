import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "./SidebarBrand";
import { NavGroup } from "./NavGroup";
import { NavBottom } from "./NavBottom";
import { NavUser } from "./NavUser";
import { sidebarNavGroups, sidebarBottomItems } from "./sidebar-data";

interface AppSidebarProps {
    platformName: string;
    user: { name: string; email: string };
    onLogout: () => void;
}

export function AppSidebar({ platformName, user, onLogout }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarBrand platformName={platformName} />
            </SidebarHeader>

            <SidebarContent>
                {/* Navigation groups */}
                {sidebarNavGroups.map((group) => (
                    <NavGroup key={group.label} label={group.label} items={group.items} />
                ))}

                {/* Bottom items (settings, help) */}
                <NavBottom items={sidebarBottomItems} onLogout={onLogout} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} onLogout={onLogout} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
