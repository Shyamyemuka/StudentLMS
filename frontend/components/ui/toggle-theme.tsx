"use client";

import { useId, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

const SwitchToggleThemeDemo = () => {
  const id = useId();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-20 h-6 bg-transparent" />; // Invisible placeholder during hydration
  }

  const isDark = resolvedTheme === "dark";
  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="group inline-flex items-center gap-2">
      <span
        id={`${id}-light`}
        className={cn(
          "cursor-pointer text-left text-sm font-medium transition-all duration-200 hover:scale-110",
          isDark ? "text-foreground/40 hover:text-foreground" : "text-foreground",
        )}
        aria-controls={id}
        onClick={() => handleToggle(false)}
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </span>

      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-labelledby={`${id}-light ${id}-dark`}
        aria-label="Toggle between dark and light mode"
        className="border-2 border-border shadow-[2px_2px_0px_0px_var(--color-shadow)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      />

      <span
        id={`${id}-dark`}
        className={cn(
          "cursor-pointer text-right text-sm font-medium transition-all duration-200 hover:scale-110",
          isDark ? "text-foreground" : "text-foreground/40 hover:text-foreground",
        )}
        aria-controls={id}
        onClick={() => handleToggle(true)}
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
};

export default SwitchToggleThemeDemo;
