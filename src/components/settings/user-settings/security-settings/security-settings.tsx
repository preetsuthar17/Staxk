"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChangePassword } from "./change-password";
import { PasskeySettings } from "./passkey-settings";
import { SessionList } from "./session-list";
import { TwoFactorSettings } from "./two-factor-settings";

export function SecuritySettings() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">Security</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <SessionList />
        </CardContent>
      </Card>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <ChangePassword />
        </CardContent>
      </Card>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <TwoFactorSettings />
        </CardContent>
      </Card>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <PasskeySettings />
        </CardContent>
      </Card>
    </div>
  );
}
