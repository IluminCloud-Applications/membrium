import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SettingsSectionProps {
    icon: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function SettingsSection({ icon, title, description, children }: SettingsSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <i className={`${icon} text-primary text-lg`} />
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
