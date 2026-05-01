import { useNavigate } from "react-router-dom";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/useTheme";

interface NavUserProps {
    user: {
        name: string;
    };
    onLogout: () => void;
}

export function NavUser({ user, onLogout }: NavUserProps) {
    const { isMobile } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-[10px] text-muted-foreground/60">
                                    v1.0.3
                                </span>
                            </div>
                            <i className="ri-arrow-up-down-line text-base text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-[10px] text-muted-foreground/60">
                                        v1.0.3
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => navigate("/admin/configuracoes")}>
                                <i className="ri-settings-3-line mr-2" />
                                Configurações
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={toggleTheme}>
                                <i className={`${theme === "dark" ? "ri-sun-line" : "ri-moon-line"} mr-2`} />
                                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="https://ilumin.app?src=membrium" target="_blank" rel="noopener noreferrer">
                                    <i className="ri-lifebuoy-line mr-2" />
                                    Ajuda
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onLogout}>
                            <i className="ri-logout-box-r-line mr-2" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

