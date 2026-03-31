import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface IntegrationToggleProps {
    id: string;
    icon: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void | Promise<void>;
    badge?: React.ReactNode;
    children?: React.ReactNode;
}

export function IntegrationToggle({
    id,
    icon,
    title,
    description,
    enabled,
    onToggle,
    badge,
    children,
}: IntegrationToggleProps) {
    const [toggling, setToggling] = useState(false);

    async function handleToggle(value: boolean) {
        setToggling(true);
        try {
            await onToggle(value);
        } finally {
            setToggling(false);
        }
    }

    return (
        <div className="rounded-lg border bg-card">
            {/* Header row */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <i className={`${icon} text-xl text-primary`} />
                    </div>
                    <div>
                        <Label htmlFor={id} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                            {title}
                            {badge}
                        </Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
                <Switch
                    id={id}
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={toggling}
                />
            </div>

            {/* Expandable content */}
            {enabled && children && (
                <>
                    <Separator />
                    <div className="p-4 space-y-4 animate-fade-in">
                        {children}
                    </div>
                </>
            )}
        </div>
    );
}
