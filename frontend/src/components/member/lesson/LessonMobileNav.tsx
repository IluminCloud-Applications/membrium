interface LessonMobileNavProps {
    onOpenModules: () => void;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

export function LessonMobileNav({
    onOpenModules,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext,
}: LessonMobileNavProps) {
    return (
        <nav className="lesson-mobile-nav">
            {/* Home */}
            <a href="/member" className="lesson-mobile-nav-item" title="Início">
                <i className="ri-home-4-line" />
                <span>Início</span>
            </a>

            {/* Previous lesson */}
            <button
                className="lesson-mobile-nav-item"
                onClick={onPrevious}
                disabled={!hasPrevious}
                title="Aula anterior"
            >
                <i className="ri-skip-back-line" />
                <span>Anterior</span>
            </button>

            {/* Módulos — center, highlighted */}
            <button
                className="lesson-mobile-nav-item lesson-mobile-nav-modules"
                onClick={onOpenModules}
                title="Ver módulos e aulas"
            >
                <i className="ri-list-check-2" />
                <span>Aulas</span>
            </button>

            {/* Next lesson */}
            <button
                className="lesson-mobile-nav-item"
                onClick={onNext}
                disabled={!hasNext}
                title="Próxima aula"
            >
                <i className="ri-skip-forward-line" />
                <span>Próxima</span>
            </button>

            {/* Profile */}
            <a href="/member/perfil" className="lesson-mobile-nav-item" title="Perfil">
                <i className="ri-user-line" />
                <span>Perfil</span>
            </a>
        </nav>
    );
}
