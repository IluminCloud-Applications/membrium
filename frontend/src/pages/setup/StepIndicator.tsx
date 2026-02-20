interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-3 mb-8">
            {steps.map((label, index) => {
                const isActive = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={label} className="flex items-center gap-3">
                        {index > 0 && (
                            <div
                                className={`h-px w-8 transition-colors duration-300 ${index <= currentStep ? "bg-primary" : "bg-border"
                                    }`}
                            />
                        )}
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${isCurrent
                                        ? "bg-primary text-primary-foreground scale-110"
                                        : isActive
                                            ? "bg-primary/20 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {isActive && index < currentStep ? (
                                    <i className="ri-check-line text-sm" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={`text-[10px] ${isCurrent
                                        ? "text-foreground font-medium"
                                        : isActive
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
