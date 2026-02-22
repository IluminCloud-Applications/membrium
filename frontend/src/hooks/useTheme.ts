import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem("membrium-theme") as Theme | null;
        return stored ?? "dark";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        localStorage.setItem("membrium-theme", theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }

    return { theme, toggleTheme };
}
