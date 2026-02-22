import type { MemberCourseGroup } from "@/types/member";

interface GroupSelectorModalProps {
    groups: MemberCourseGroup[];
    onSelect: (groupId: number) => void;
    platformName: string;
}

export function GroupSelectorModal({ groups, onSelect, platformName }: GroupSelectorModalProps) {
    return (
        <div className="group-selector-overlay">
            <div className="group-selector-content animate-scale-in">
                <div className="group-selector-header">
                    <h1 className="group-selector-title">{platformName}</h1>
                    <p className="group-selector-subtitle">
                        Selecione a área que deseja acessar
                    </p>
                </div>

                <div className="group-selector-grid">
                    {groups.map((group) => {
                        const principal = group.courses.find(
                            (c) => c.id === group.principalCourseId
                        );
                        const banner = principal?.coverDesktop || principal?.coverMobile;
                        const image = principal?.image;
                        const coursesCount = group.courses.length;

                        return (
                            <button
                                key={group.id}
                                className="group-selector-card"
                                onClick={() => onSelect(group.id)}
                            >
                                <div className="group-selector-card-image">
                                    {banner ? (
                                        <img
                                            src={`/static/uploads/${banner}`}
                                            alt={group.name}
                                            className="group-selector-card-img"
                                        />
                                    ) : image ? (
                                        <img
                                            src={image}
                                            alt={group.name}
                                            className="group-selector-card-img"
                                        />
                                    ) : (
                                        <div className="group-selector-card-placeholder">
                                            <i className="ri-stack-line" />
                                        </div>
                                    )}
                                    <div className="group-selector-card-overlay" />
                                </div>

                                <div className="group-selector-card-info">
                                    <h3 className="group-selector-card-name">{group.name}</h3>
                                    <p className="group-selector-card-meta">
                                        {coursesCount} curso{coursesCount !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
