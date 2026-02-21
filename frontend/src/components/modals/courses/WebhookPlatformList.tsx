import type { WebhookPlatform } from "./WebhookModal";

interface WebhookPlatformListProps {
    platforms: WebhookPlatform[];
    onSelect: (platform: WebhookPlatform) => void;
}

export function WebhookPlatformList({ platforms, onSelect }: WebhookPlatformListProps) {
    return (
        <div className="grid grid-cols-2 gap-3 pt-2">
            {platforms.map((platform) => (
                <button
                    key={platform.id}
                    onClick={() => onSelect(platform)}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:shadow-sm transition-all duration-200 text-left group"
                >
                    <img
                        src={platform.logo}
                        alt={platform.name}
                        className="w-8 h-8 rounded-lg object-contain"
                    />
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {platform.name}
                    </span>
                </button>
            ))}
        </div>
    );
}
