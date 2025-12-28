"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Smartphone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const totpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

const backupCodeSchema = z.object({
  code: z.string().min(1, "Backup code is required"),
});

type TotpFormData = z.infer<typeof totpSchema>;
type BackupCodeFormData = z.infer<typeof backupCodeSchema>;

type VerifyMethod = "totp" | "backup";

export function TwoFactorVerify() {
  const router = useRouter();
  const [method, setMethod] = useState<VerifyMethod>("totp");
  const [isLoading, setIsLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const totpForm = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: "" },
  });

  const backupForm = useForm<BackupCodeFormData>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: { code: "" },
  });

  const handleTotpSubmit = async (data: TotpFormData) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: data.code,
        trustDevice,
      });

      if (error) {
        toast.error(error.message || "Invalid code");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to verify code");
      setIsLoading(false);
    }
  };

  const handleBackupSubmit = async (data: BackupCodeFormData) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: data.code,
        trustDevice,
      });

      if (error) {
        toast.error(error.message || "Invalid backup code");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to verify backup code");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-xs flex-col gap-8 bg-transparent">
      <div className="flex flex-col items-center justify-center gap-4">
        <Image alt="Staxk Logo" height={38} src="/logo.svg" width={38} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-center font-medium text-xl">
            Two-Factor Authentication
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            {method === "totp"
              ? "Enter the 6-digit code from your authenticator app"
              : "Enter one of your backup codes"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {method === "totp" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={totpForm.handleSubmit(handleTotpSubmit)}
          >
            <div className="flex flex-col gap-2 p-1">
              <Label className="sr-only" htmlFor="totp-code">
                Verification Code
              </Label>
              <div className="relative">
                <Input
                  {...totpForm.register("code")}
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center font-mono text-lg tracking-widest"
                  disabled={isLoading}
                  id="totp-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  placeholder="000000"
                />
              </div>
              {totpForm.formState.errors.code && (
                <p className="text-center text-destructive text-xs">
                  {totpForm.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={trustDevice}
                disabled={isLoading}
                id="trust-device"
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
              />
              <Label
                className="cursor-pointer font-normal text-muted-foreground text-sm"
                htmlFor="trust-device"
              >
                Trust this device for 30 days
              </Label>
            </div>

            <div className="p-1">
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? <Spinner /> : "Verify"}
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={backupForm.handleSubmit(handleBackupSubmit)}
          >
            <div className="flex flex-col gap-2 p-1">
              <Label className="sr-only" htmlFor="backup-code">
                Backup Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...backupForm.register("code")}
                  autoComplete="off"
                  autoFocus
                  className="pl-10 font-mono"
                  disabled={isLoading}
                  id="backup-code"
                  placeholder="Enter backup code"
                />
              </div>
              {backupForm.formState.errors.code && (
                <p className="text-center text-destructive text-xs">
                  {backupForm.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={trustDevice}
                disabled={isLoading}
                id="trust-device-backup"
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
              />
              <Label
                className="cursor-pointer font-normal text-muted-foreground text-sm"
                htmlFor="trust-device-backup"
              >
                Trust this device for 30 days
              </Label>
            </div>

            <div className="p-1">
              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? <Spinner /> : "Verify"}
              </Button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-xs">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          className="w-full"
          disabled={isLoading}
          onClick={() => {
            setMethod(method === "totp" ? "backup" : "totp");
            totpForm.reset();
            backupForm.reset();
          }}
          type="button"
          variant="outline"
        >
          {method === "totp" ? (
            <>
              <KeyRound className="size-4" />
              Use backup code
            </>
          ) : (
            <>
              <Smartphone className="size-4" />
              Use authenticator app
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
