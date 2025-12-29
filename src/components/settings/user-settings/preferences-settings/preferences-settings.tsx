"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "./theme-switcher";

export function PreferencesSettings() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">Preferences</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
