import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarBrandProps {
    platformName: string;
}

export function SidebarBrand({ platformName }: SidebarBrandProps) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    asChild
                >
                    <a href="https://ilumin.app?src=membrium" target="_blank" rel="noopener noreferrer">
                        {/* Fire gradient icon */}
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <i className="ri-fire-fill text-base" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{platformName}</span>
                            <span className="truncate text-xs text-muted-foreground">
                                Membrium
                            </span>
                        </div>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
