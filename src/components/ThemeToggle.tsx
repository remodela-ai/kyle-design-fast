import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="w-6 h-6 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-all duration-200 opacity-50 hover:opacity-100"
    >
      {isDark ? (
        <Sun className="h-3 w-3 text-muted-foreground" />
      ) : (
        <Moon className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}
