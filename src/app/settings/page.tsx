import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">General</h1>
      </div>
      <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}

