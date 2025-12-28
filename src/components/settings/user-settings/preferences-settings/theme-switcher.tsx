"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      <div className="flex w-full flex-col items-start gap-2">
        <Label className="font-medium text-sm">Theme</Label>
        <div className="flex h-9 w-full gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
          <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
          <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <Label className="font-medium text-sm" htmlFor="theme">
          Theme
        </Label>
        <div className="flex flex-row gap-2">
          {themes.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <Tooltip key={value}>
                <TooltipTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      aria-label={`Switch to ${label.toLowerCase()} theme`}
                      aria-pressed={isActive}
                      className="flex flex-col items-center justify-center"
                      id={`theme-${value}`}
                      onClick={() => setTheme(value)}
                      size={"icon"}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                    >
                      <Icon className="size-4" />
                    </Button>
                  )}
                />
                <TooltipContent align="center" side="top">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
