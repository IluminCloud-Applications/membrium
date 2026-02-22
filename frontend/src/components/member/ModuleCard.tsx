import type { MemberModule } from "@/types/member";

interface ModuleCardProps {
    module: MemberModule;
    index: number;
    onClick: () => void;
}

export function ModuleCard({ module, index, onClick }: ModuleCardProps) {
    const progress = module.totalLessons > 0
        ? Math.round((module.completedLessons / module.totalLessons) * 100)
        : 0;

    const isCompleted = progress === 100;
    const isLocked = module.isLocked ?? false;
    const daysRemaining = module.unlockDaysRemaining ?? 0;

    function handleClick() {
        if (isLocked) return; // Don't navigate if locked
        onClick();
    }

    return (
        <button
            className={`member-module-card ${isLocked ? "member-module-locked" : ""}`}
            onClick={handleClick}
            style={{ animationDelay: `${index * 0.05}s` }}
            title={isLocked ? `Libera em ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}` : module.name}
        >
            <div className="member-module-image-wrap">
                {module.image ? (
                    <img
                        src={`/static/uploads/${module.image}`}
                        alt={module.name}
                        className="member-module-image"
                        loading="lazy"
                        draggable="false"
                    />
                ) : (
                    <div className="member-module-placeholder">
                        <i className="ri-folder-video-line" />
                    </div>
                )}

                {/* Lock badge */}
                {isLocked && (
                    <div className="member-module-lock-badge">
                        <i className="ri-lock-line" />
                    </div>
                )}

                {/* Progress overlay (only if unlocked) */}
                {!isLocked && module.totalLessons > 0 && (
                    <div className="member-module-progress-bar">
                        <div
                            className="member-module-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Completed badge */}
                {!isLocked && isCompleted && (
                    <div className="member-module-completed-badge">
                        <i className="ri-check-line" />
                    </div>
                )}
            </div>

            <div className="member-module-info">
                <h3 className="member-module-name">{module.name}</h3>
                <p className="member-module-meta">
                    {isLocked ? (
                        <span className="member-module-lock-text">
                            <i className="ri-lock-line" /> Libera em {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}
                        </span>
                    ) : (
                        <>
                            {module.completedLessons}/{module.totalLessons} aulas
                            {progress > 0 && !isCompleted && ` · ${progress}%`}
                        </>
                    )}
                </p>
            </div>
        </button>
    );
}
