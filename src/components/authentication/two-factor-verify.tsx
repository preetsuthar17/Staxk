"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TwoFactorVerify() {
  const router = useRouter();
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyTotp = useCallback(async () => {
    setError(null);

    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        return;
      }

      toast.success("Verification successful");
      router.push("/home");
      router.refresh();
    } catch (_error) {
      setError("An error occurred while verifying code");
    } finally {
      setIsLoading(false);
    }
  }, [totpCode, trustDevice, router]);

  const handleVerifyBackupCode = useCallback(async () => {
    setError(null);

    if (!backupCode.trim()) {
      setError("Please enter a backup code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message || "Invalid backup code");
        return;
      }

      toast.success("Verification successful");
      router.push("/home");
      router.refresh();
    } catch (_error) {
      setError("An error occurred while verifying backup code");
    } finally {
      setIsLoading(false);
    }
  }, [backupCode, trustDevice, router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (useBackupCode) {
        handleVerifyBackupCode();
      } else {
        handleVerifyTotp();
      }
    },
    [useBackupCode, handleVerifyBackupCode, handleVerifyTotp]
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h1 className="font-medium text-2xl">Two-Factor Authentication</h1>
        <p className="text-muted-foreground text-sm">
          Enter the verification code from your authenticator app to continue.
        </p>
      </div>

      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        {useBackupCode ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              aria-describedby={error ? "backup-code-error" : undefined}
              aria-invalid={!!error}
              autoComplete="one-time-code"
              disabled={isLoading}
              id="backup-code"
              onChange={(e) => {
                setBackupCode(e.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Enter your backup code…"
              type="text"
              value={backupCode}
            />
            {error && (
              <FieldError
                errors={[{ message: error }]}
                id="backup-code-error"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <InputOTP
              autoFocus
              className="w-full"
              disabled={isLoading}
              maxLength={6}
              onChange={(value) => {
                setTotpCode(value);
                if (error) {
                  setError(null);
                }
              }}
              value={totpCode}
            >
              <InputOTPGroup className="h-10 w-full">
                <InputOTPSlot className="h-10 w-full" index={0} />
                <InputOTPSlot className="h-10 w-full" index={1} />
                <InputOTPSlot className="h-10 w-full" index={2} />
                <InputOTPSlot className="h-10 w-full" index={3} />
                <InputOTPSlot className="h-10 w-full" index={4} />
                <InputOTPSlot className="h-10 w-full" index={5} />
              </InputOTPGroup>
            </InputOTP>
            {error && <FieldError errors={[{ message: error }]} />}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label
            className="flex items-center gap-2 font-normal"
            htmlFor="trust-device"
          >
            <Checkbox
              checked={trustDevice}
              disabled={isLoading}
              id="trust-device"
              name="trust-device"
              onCheckedChange={(checked) => setTrustDevice(checked === true)}
            />
            Trust this device for 30 days
          </Label>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            disabled={
              isLoading ||
              (useBackupCode ? !backupCode.trim() : totpCode.length !== 6)
            }
            loading={isLoading}
            type="submit"
          >
            Verify
          </Button>
          <Button
            disabled={isLoading}
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setTotpCode("");
              setBackupCode("");
              setError(null);
            }}
            type="button"
            variant="outline"
          >
            {useBackupCode
              ? "Use Authenticator Code Instead"
              : "Use Backup Code Instead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
