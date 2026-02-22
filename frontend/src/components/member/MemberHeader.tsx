import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { memberService } from "@/services/member";
import { authService } from "@/services/authService";
import { MobileBottomNav } from "./MobileBottomNav";
import type { MemberMenuItem, SearchResult } from "@/types/member";

interface MemberHeaderProps {
    platformName: string;
    studentName: string;
    menuItems: MemberMenuItem[];
}

export function MemberHeader({ platformName, studentName, menuItems }: MemberHeaderProps) {
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 50);
        }
        handleScroll(); // check initial state
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    async function handleLogout() {
        try { await authService.logout(); } catch { /* ignore */ }
        window.location.href = "/login";
    }

    return (
        <>
            <header className={`member-header ${scrolled ? "member-header-scrolled" : ""}`}>
                <div className="member-header-inner">
                    {/* Left: Logo + Menu */}
                    <div className="member-header-left">
                        <a href="/member" className="member-logo">{platformName}</a>
                        <nav className="member-nav">
                            {menuItems.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.url}
                                    target={item.url.startsWith("http") ? "_blank" : undefined}
                                    rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className="member-nav-link"
                                >
                                    {item.icon && <i className={item.icon} />}
                                    {item.name}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Right: Search + User */}
                    <div className="member-header-right">
                        <button
                            className="member-icon-btn"
                            onClick={() => setSearchOpen(true)}
                            title="Pesquisar"
                        >
                            <i className="ri-search-line" />
                        </button>

                        <div className="member-user-menu" ref={dropdownRef}>
                            <button
                                className="member-avatar-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <div className="member-avatar">
                                    {studentName.charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {dropdownOpen && (
                                <div className="member-dropdown animate-scale-in">
                                    <div className="member-dropdown-header">
                                        <p className="member-dropdown-name">{studentName}</p>
                                    </div>
                                    <div className="member-dropdown-divider" />
                                    <button
                                        className="member-dropdown-item"
                                        onClick={() => { setDropdownOpen(false); navigate("/member/perfil"); }}
                                    >
                                        <i className="ri-user-line" />
                                        Perfil
                                    </button>
                                    <button
                                        className="member-dropdown-item member-dropdown-item-danger"
                                        onClick={handleLogout}
                                    >
                                        <i className="ri-logout-box-r-line" />
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {searchOpen && (
                <SearchModal onClose={() => setSearchOpen(false)} />
            )}

            {/* Mobile floating bottom nav */}
            <MobileBottomNav
                onSearchClick={() => setSearchOpen(true)}
                menuItems={menuItems}
            />
        </>
    );
}


/* ============================================
   SEARCH MODAL
   ============================================ */
function SearchModal({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        inputRef.current?.focus();
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    function handleSearch(value: string) {
        setQuery(value);
        clearTimeout(timerRef.current);
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await memberService.search(value);
                setResults(data);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 300);
    }

    function buildResultUrl(r: SearchResult): string {
        if (r.type === "lesson" && r.moduleId) {
            return `/member/${r.courseId}/${r.moduleId}?lesson=${r.id}`;
        }
        // Module: go to first module of course (moduleId is the module itself)
        return `/member/${r.courseId}/${r.id}`;
    }

    function handleResultClick(r: SearchResult) {
        onClose();
        navigate(buildResultUrl(r));
    }

    return (
        <div className="member-search-overlay" onClick={onClose}>
            <div className="member-search-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="member-search-input-wrap">
                    <i className="ri-search-line member-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Pesquisar módulos e aulas..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="member-search-input"
                    />
                    <button className="member-search-close" onClick={onClose}>
                        <kbd>ESC</kbd>
                    </button>
                </div>

                {(results.length > 0 || loading) && (
                    <div className="member-search-results">
                        {loading ? (
                            <div className="member-search-loading">
                                <i className="ri-loader-4-line animate-spin" />
                                Pesquisando...
                            </div>
                        ) : (
                            results.map((r) => (
                                <button
                                    key={`${r.type}-${r.id}`}
                                    className="member-search-result"
                                    onClick={() => handleResultClick(r)}
                                    type="button"
                                >
                                    <i className={r.type === "module" ? "ri-folder-line" : "ri-play-circle-line"} />
                                    <div>
                                        <p className="member-search-result-title">{r.title}</p>
                                        <p className="member-search-result-meta">
                                            {r.courseName}
                                            {r.moduleName && ` · ${r.moduleName}`}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {query.length >= 2 && !loading && results.length === 0 && (
                    <div className="member-search-empty">
                        <i className="ri-search-line" />
                        <p>Nenhum resultado encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
}
