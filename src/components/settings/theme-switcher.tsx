"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Button aria-label="Light theme" disabled size="icon" variant="outline">
          <IconSun className="size-4" />
        </Button>
        <Button aria-label="Dark theme" disabled size="icon" variant="outline">
          <IconMoon className="size-4" />
        </Button>
        <Button
          aria-label="System theme"
          disabled
          size="icon"
          variant="outline"
        >
          <IconDeviceDesktop className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Light theme"
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
            size="icon"
            variant={theme === "light" ? "default" : "outline"}
          >
            <IconSun className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Light</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Dark theme"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
            size="icon"
            variant={theme === "dark" ? "default" : "outline"}
          >
            <IconMoon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Dark</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="System theme"
            aria-pressed={theme === "system"}
            onClick={() => setTheme("system")}
            size="icon"
            variant={theme === "system" ? "default" : "outline"}
          >
            <IconDeviceDesktop className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>System</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
