interface ActionButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
}

/**
 * Action button that expands to show its label on hover.
 * Shows icon-only by default, smoothly reveals text on hover.
 */
export function ActionButton({
    icon,
    label,
    onClick,
    variant = "default",
}: ActionButtonProps) {
    const variantClasses =
        variant === "danger"
            ? "bg-card shadow-sm hover:bg-destructive/10 text-destructive"
            : "bg-card shadow-sm hover:bg-accent";

    return (
        <button
            onClick={onClick}
            className={`group/action h-8 rounded-lg flex items-center gap-0 hover:gap-1.5 px-2 hover:px-3 transition-all duration-200 text-xs font-medium whitespace-nowrap ${variantClasses}`}
        >
            <i className={`${icon} text-sm shrink-0`} />
            <span className="max-w-0 overflow-hidden group-hover/action:max-w-[80px] opacity-0 group-hover/action:opacity-100 transition-all duration-200">
                {label}
            </span>
        </button>
    );
}
