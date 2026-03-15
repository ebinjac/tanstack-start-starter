import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-30" />; // Placeholder to avoid layout shift
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-default-100 rounded-full border border-divider",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-all duration-200 ${
          theme === "light"
            ? "bg-background shadow-sm text-foreground scale-110"
            : "text-foreground/40 hover:text-foreground"
        }`}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-all duration-200 ${
          theme === "dark"
            ? "bg-background shadow-sm text-foreground scale-110"
            : "text-foreground/40 hover:text-foreground"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-all duration-200 ${
          theme === "system"
            ? "bg-background shadow-sm text-foreground scale-110"
            : "text-foreground/40 hover:text-foreground"
        }`}
        aria-label="System mode"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
