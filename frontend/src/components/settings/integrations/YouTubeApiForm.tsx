import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface YouTubeApiFormProps {
    clientId: string;
    setClientId: (value: string) => void;
    clientSecret: string;
    setClientSecret: (value: string) => void;
}

export function YouTubeApiForm({
    clientId,
    setClientId,
    clientSecret,
    setClientSecret,
}: YouTubeApiFormProps) {
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);

    const redirectUrl = `${window.location.protocol}//${window.location.host}/auth/youtube/callback`;

    function handleCopyRedirectUrl() {
        navigator.clipboard.writeText(redirectUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-4">
            {/* Redirect URL (read-only, with copy) */}
            <div className="space-y-2">
                <Label>URI de Redirecionamento</Label>
                <div className="flex gap-2">
                    <Input
                        readOnly
                        value={redirectUrl}
                        className="font-mono text-xs bg-muted"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyRedirectUrl}
                        title="Copiar URL"
                        className="shrink-0"
                    >
                        <i className={copied ? "ri-check-line text-green-500" : "ri-file-copy-line"} />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Cole esta URL no campo "URIs de redirecionamento autorizados" do Google Cloud Console.
                </p>
            </div>

            {/* OAuth Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="youtubeClientId">Client ID</Label>
                    <Input
                        id="youtubeClientId"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="XXXXX.apps.googleusercontent.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="youtubeClientSecret">Client Secret</Label>
                    <div className="relative">
                        <Input
                            id="youtubeClientSecret"
                            type={showSecret ? "text" : "password"}
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            placeholder="GOCSPX-XXXXXXXXXXXXXXXXXXXX"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showSecret ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
