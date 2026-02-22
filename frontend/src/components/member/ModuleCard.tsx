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

    return (
        <button
            className="member-module-card"
            onClick={onClick}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className="member-module-image-wrap">
                {module.image ? (
                    <img
                        src={`/static/uploads/${module.image}`}
                        alt={module.name}
                        className="member-module-image"
                        loading="lazy"
                    />
                ) : (
                    <div className="member-module-placeholder">
                        <i className="ri-folder-video-line" />
                    </div>
                )}

                {/* Progress overlay */}
                {module.totalLessons > 0 && (
                    <div className="member-module-progress-bar">
                        <div
                            className="member-module-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Completed badge */}
                {isCompleted && (
                    <div className="member-module-completed-badge">
                        <i className="ri-check-line" />
                    </div>
                )}
            </div>

            <div className="member-module-info">
                <h3 className="member-module-name">{module.name}</h3>
                <p className="member-module-meta">
                    {module.completedLessons}/{module.totalLessons} aulas
                    {progress > 0 && !isCompleted && ` · ${progress}%`}
                </p>
            </div>
        </button>
    );
}
