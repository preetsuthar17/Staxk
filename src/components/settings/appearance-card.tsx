"use client";

import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function AppearanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance & Display</CardTitle>
        <CardDescription>
          Customize your appearance and display settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex w-full items-center justify-between gap-3">
            <Label htmlFor="theme" id="theme-label">
              Theme
            </Label>
            <ThemeSwitcher />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
