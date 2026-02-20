import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface WebhookPlatform {
    id: string;
    name: string;
    icon: string;
    color: string;
}

const platforms: WebhookPlatform[] = [
    { id: "hotmart", name: "Hotmart", icon: "ri-fire-line", color: "text-orange-500" },
    { id: "kiwify", name: "Kiwify", icon: "ri-shopping-bag-line", color: "text-green-500" },
    { id: "eduzz", name: "Eduzz", icon: "ri-store-line", color: "text-blue-500" },
    { id: "braip", name: "Braip", icon: "ri-flashlight-line", color: "text-purple-500" },
    { id: "monetizze", name: "Monetizze", icon: "ri-money-dollar-circle-line", color: "text-amber-500" },
    { id: "perfectpay", name: "PerfectPay", icon: "ri-bank-card-line", color: "text-cyan-500" },
];

interface WebhookModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseName: string;
}

export function WebhookModal({ open, onOpenChange, courseName }: WebhookModalProps) {
    function handleSelectPlatform(platform: WebhookPlatform) {
        console.log("Selected platform:", platform.id, "for course:", courseName);
        // TODO: API call to configure webhook
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-webhook-line text-primary" />
                        Configurar Webhook
                    </DialogTitle>
                    <DialogDescription>
                        Selecione a plataforma para integrar com <strong>{courseName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    {platforms.map((platform) => (
                        <button
                            key={platform.id}
                            onClick={() => handleSelectPlatform(platform)}
                            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:shadow-sm transition-all duration-200 text-left"
                        >
                            <div className={`text-xl ${platform.color}`}>
                                <i className={platform.icon} />
                            </div>
                            <span className="font-medium text-sm">{platform.name}</span>
                        </button>
                    ))}
                </div>

                {/* Help link */}
                <div className="flex items-center justify-center pt-2 border-t">
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                        <i className="ri-question-line" />
                        Como configurar webhooks?
                        <i className="ri-external-link-line" />
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
