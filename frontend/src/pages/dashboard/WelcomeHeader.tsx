interface WelcomeHeaderProps {
    userName: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
    const firstName = userName.split(" ")[0];
    const hour = new Date().getHours();

    let greeting = "Bom dia";
    let icon = "ri-sun-line";

    if (hour >= 12 && hour < 18) {
        greeting = "Boa tarde";
        icon = "ri-sun-foggy-line";
    } else if (hour >= 18 || hour < 5) {
        greeting = "Boa noite";
        icon = "ri-moon-line";
    }

    return (
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <i className={`${icon} text-primary`} />
                {greeting}, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground">
                Aqui está o resumo da sua plataforma
            </p>
        </div>
    );
}
