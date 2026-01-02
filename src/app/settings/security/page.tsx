"use client";

import { LogoutButton } from "@/components/authentication/logout-button";
import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { PasskeyCard } from "@/components/settings/passkey-card";
import { TwoFactorCard } from "@/components/settings/two-factor-card";

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">Security</h1>
      </div>
      <div className="flex flex-col gap-6">
        <ChangePasswordCard />
        <TwoFactorCard />
        <PasskeyCard />
        <LogoutButton />
      </div>
    </div>
  );
}
