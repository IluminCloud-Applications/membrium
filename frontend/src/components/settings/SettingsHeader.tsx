interface SettingsHeaderProps {
    icon: string;
    title: string;
    description: string;
}

export function SettingsHeader({ icon, title, description }: SettingsHeaderProps) {
    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <i className={`${icon} text-primary`} />
                {title}
            </h1>
            <p className="text-sm text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
