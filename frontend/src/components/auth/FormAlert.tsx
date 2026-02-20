interface FormAlertProps {
    message: string | null;
    type?: "error" | "success";
}

export function FormAlert({ message, type = "error" }: FormAlertProps) {
    if (!message) return null;

    const styles = {
        error:
            "bg-destructive/10 border-destructive/20 text-destructive",
        success:
            "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    };

    const icons = {
        error: "ri-error-warning-line",
        success: "ri-checkbox-circle-line",
    };

    return (
        <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm animate-fade-in ${styles[type]}`}
            role="alert"
        >
            <i className={`${icons[type]} text-base shrink-0`} />
            <span>{message}</span>
        </div>
    );
}
