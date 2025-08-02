import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start">
        <div className="w-4 h-4 mr-2" />
        <span>Theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-full justify-start"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 mr-2" />
      ) : (
        <Sun className="h-4 w-4 mr-2" />
      )}
      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
    </Button>
  );
}