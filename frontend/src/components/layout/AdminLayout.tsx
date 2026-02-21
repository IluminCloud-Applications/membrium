import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/sidebar";
import { authService } from "@/services/authService";

interface AdminLayoutProps {
    platformName: string;
    user: { name: string };
    pageTitle: string;
}

export function AdminLayout({ platformName, user }: AdminLayoutProps) {
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await authService.logout();
        } catch {
            // ignore
        }
        navigate("/login");
    }

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar
                    platformName={platformName}
                    user={user}
                    onLogout={handleLogout}
                />
                <SidebarInset>
                    {/* Page content */}
                    <div className="flex flex-1 flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
