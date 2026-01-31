"use client";

import { IconCopy, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";

interface EnablePasswordFormProps {
  isEnabling: boolean;
  password: string;
  passwordError: string | null;
  showPassword: boolean;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

function EnablePasswordForm({
  isEnabling,
  password,
  passwordError,
  showPassword,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onCancel,
}: EnablePasswordFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogDescription>
          Enter your password to begin setting up two-factor authentication.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="enable-password">Password</Label>
          <div className="flex gap-0.5">
            <Input
              aria-describedby={
                passwordError ? "enable-password-error" : undefined
              }
              aria-invalid={!!passwordError}
              autoComplete="current-password"
              className="flex-1"
              disabled={isEnabling}
              id="enable-password"
              onChange={(e) => {
                onPasswordChange(e.target.value);
              }}
              placeholder="Enter your password…"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <Button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="size-10 shrink-0"
              disabled={isEnabling}
              onClick={onShowPasswordToggle}
              size="icon"
              tabIndex={-1}
              type="button"
              variant="outline"
            >
              {showPassword ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </Button>
          </div>
          {passwordError && (
            <FieldError
              errors={[{ message: passwordError }]}
              id="enable-password-error"
            />
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={isEnabling}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={isEnabling} loading={isEnabling} type="submit">
          Continue
        </Button>
      </DialogFooter>
    </form>
  );
}

interface VerifyTotpStepProps {
  isEnabling: boolean;
  totpCode: string;
  totpError: string | null;
  onTotpCodeChange: (value: string) => void;
  onVerify: () => void;
  onBack: () => void;
}

function VerifyTotpStep({
  isEnabling,
  totpCode,
  totpError,
  onTotpCodeChange,
  onVerify,
  onBack,
}: VerifyTotpStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Verify Setup</DialogTitle>
        <DialogDescription>
          Enter the 6-digit code from your authenticator app to verify and
          complete the setup.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="totp-code">Verification Code</Label>
        <InputOTP
          disabled={isEnabling}
          maxLength={6}
          onChange={onTotpCodeChange}
          value={totpCode}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {totpError && <FieldError errors={[{ message: totpError }]} />}
      </div>
      <DialogFooter>
        <Button
          disabled={isEnabling}
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button
          disabled={isEnabling || totpCode.length !== 6}
          loading={isEnabling}
          onClick={onVerify}
          type="button"
        >
          Verify & Enable
        </Button>
      </DialogFooter>
    </div>
  );
}

interface ScanQRCodeStepProps {
  isEnabling: boolean;
  totpURI: string;
  showSecret: boolean;
  secret: string | null;
  onShowSecretToggle: () => void;
  onCopySecret: () => void;
  onCancel: () => void;
  onContinue: () => void;
}

function ScanQRCodeStep({
  isEnabling,
  totpURI,
  showSecret,
  secret,
  onShowSecretToggle,
  onCopySecret,
  onCancel,
  onContinue,
}: ScanQRCodeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogDescription>
          Scan this QR code with your authenticator app (e.g., Google
          Authenticator, Authy).
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center">
        <div className="rounded-lg border bg-white p-4">
          <QRCode size={256} value={totpURI} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="manual-entry">Can't scan the QR code?</Label>
          <Button
            onClick={onShowSecretToggle}
            size="sm"
            type="button"
            variant="outline"
          >
            {showSecret ? "Hide" : "Show"} Secret Key
          </Button>
        </div>
        {showSecret && secret && (
          <div className="flex flex-col gap-2">
            <div className="rounded-md border bg-muted p-3">
              <div className="flex items-center justify-between gap-2">
                <code className="flex-1 break-all font-mono text-sm">
                  {secret}
                </code>
                <Button
                  onClick={onCopySecret}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <IconCopy className="size-4" />
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Enter this code manually in your authenticator app if you can't
              scan the QR code.
            </p>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          disabled={isEnabling}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={isEnabling} onClick={onContinue} type="button">
          I've Scanned QR Code
        </Button>
      </DialogFooter>
    </div>
  );
}

export function TwoFactorCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [_showBackupCodes, setShowBackupCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const checkTwoFactorStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const sessionData = await authClient.getSession();
      if (sessionData?.data?.user?.twoFactorEnabled) {
        setTwoFactorEnabled(true);
      } else {
        setTwoFactorEnabled(false);
      }
    } catch {
      // Error handled via state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkTwoFactorStatus().catch(() => undefined);
  }, [checkTwoFactorStatus]);

  const handleEnableClick = useCallback(() => {
    setPassword("");
    setPasswordError(null);
    setTotpCode("");
    setTotpError(null);
    setTotpURI(null);
    setShowEnableDialog(true);
  }, []);

  const handleEnableSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setPasswordError(null);

      if (!password.trim()) {
        setPasswordError("Password is required");
        return;
      }

      setIsEnabling(true);

      try {
        const result = await authClient.twoFactor.enable({
          password: password.trim(),
        });

        if (result.error) {
          setPasswordError(result.error.message || "Failed to enable 2FA");
          return;
        }

        if (result.data?.totpURI) {
          setTotpURI(result.data.totpURI);
          if (result.data.backupCodes) {
            setBackupCodes(result.data.backupCodes);
          }
          setPassword("");
          setPasswordError(null);
        }
      } catch (_error) {
        setPasswordError("An error occurred while enabling 2FA");
      } finally {
        setIsEnabling(false);
      }
    },
    [password]
  );

  const handleVerifyTotp = useCallback(async () => {
    setTotpError(null);

    if (!totpCode || totpCode.length !== 6) {
      setTotpError("Please enter a 6-digit code");
      return;
    }

    setIsEnabling(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });

      if (result.error) {
        setTotpError(result.error.message || "Invalid code");
        return;
      }

      toast.success("Two-factor authentication enabled successfully");
      setShowEnableDialog(false);
      setTotpCode("");
      setTotpURI(null);
      setPassword("");
      setShowSecret(false);
      setShowVerificationStep(false);
      await checkTwoFactorStatus();
      if (backupCodes.length > 0) {
        setShowBackupCodesDialog(true);
      }
    } catch (_error) {
      setTotpError("An error occurred while verifying code");
    } finally {
      setIsEnabling(false);
    }
  }, [totpCode, checkTwoFactorStatus, backupCodes.length]);

  const handleDisableClick = useCallback(() => {
    setPassword("");
    setPasswordError(null);
    setShowDisableDialog(true);
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    setPasswordError(null);

    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    setIsDisabling(true);

    try {
      const result = await authClient.twoFactor.disable({
        password: password.trim(),
      });

      if (result.error) {
        setPasswordError(result.error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("Two-factor authentication disabled successfully");
      setShowDisableDialog(false);
      setPassword("");
      await checkTwoFactorStatus();
    } catch (_error) {
      setPasswordError("An error occurred while disabling 2FA");
    } finally {
      setIsDisabling(false);
    }
  }, [password, checkTwoFactorStatus]);

  const _handleViewBackupCodes = useCallback(() => {
    setShowBackupCodesDialog(true);
  }, []);

  const handleRegenerateClick = useCallback(() => {
    setPassword("");
    setPasswordError(null);
    setShowRegenerateDialog(true);
  }, []);

  const handleRegenerateConfirm = useCallback(async () => {
    setPasswordError(null);

    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    setIsGeneratingCodes(true);

    try {
      const result = await authClient.twoFactor.generateBackupCodes({
        password: password.trim(),
      });

      if (result.error) {
        setPasswordError(
          result.error.message || "Failed to generate backup codes"
        );
        return;
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        toast.success("Backup codes regenerated successfully");
        setShowRegenerateDialog(false);
        setPassword("");
        setPasswordError(null);
        setShowBackupCodesDialog(true);
      }
    } catch (_error) {
      setPasswordError("An error occurred while generating backup codes");
    } finally {
      setIsGeneratingCodes(false);
    }
  }, [password]);

  const copyBackupCodes = useCallback(() => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText).then(() => {
      toast.success("Backup codes copied to clipboard");
    });
  }, [backupCodes]);

  const extractSecretFromURI = useCallback((uri: string): string | null => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret");
    } catch {
      return null;
    }
  }, []);

  const copySecret = useCallback(() => {
    if (!totpURI) {
      return;
    }
    const secret = extractSecretFromURI(totpURI);
    if (secret) {
      navigator.clipboard.writeText(secret).then(() => {
        toast.success("Secret key copied to clipboard");
      });
    }
  }, [totpURI, extractSecretFromURI]);

  const isLoadingState = useMemo(() => isLoading, [isLoading]);

  const renderEnableDialogContent = () => {
    if (!totpURI) {
      return (
        <EnablePasswordForm
          isEnabling={isEnabling}
          onCancel={() => {
            setShowEnableDialog(false);
            setPassword("");
            setPasswordError(null);
          }}
          onPasswordChange={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError(null);
            }
          }}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onSubmit={handleEnableSubmit}
          password={password}
          passwordError={passwordError}
          showPassword={showPassword}
        />
      );
    }

    if (showVerificationStep) {
      return (
        <VerifyTotpStep
          isEnabling={isEnabling}
          onBack={() => {
            setShowVerificationStep(false);
            setTotpCode("");
            setTotpError(null);
          }}
          onTotpCodeChange={(value: string) => {
            setTotpCode(value);
            if (totpError) {
              setTotpError(null);
            }
          }}
          onVerify={handleVerifyTotp}
          totpCode={totpCode}
          totpError={totpError}
        />
      );
    }

    return (
      <ScanQRCodeStep
        isEnabling={isEnabling}
        onCancel={() => {
          setShowEnableDialog(false);
          setTotpCode("");
          setTotpURI(null);
          setPassword("");
          setShowSecret(false);
          setShowVerificationStep(false);
        }}
        onContinue={() => {
          setShowVerificationStep(true);
        }}
        onCopySecret={copySecret}
        onShowSecretToggle={() => setShowSecret(!showSecret)}
        secret={extractSecretFromURI(totpURI)}
        showSecret={showSecret}
        totpURI={totpURI}
      />
    );
  };

  const resetEnableDialog = useCallback(() => {
    setShowEnableDialog(false);
    setPassword("");
    setPasswordError(null);
    setTotpCode("");
    setTotpError(null);
    setTotpURI(null);
    setShowSecret(false);
    setShowVerificationStep(false);
  }, []);

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with two-factor
            authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isLoadingState ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">
                    {twoFactorEnabled
                      ? "Two-factor authentication is enabled"
                      : "Two-factor authentication is disabled"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {twoFactorEnabled
                      ? "Your account is protected with an authenticator app"
                      : "Enable two-factor authentication to secure your account"}
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  disabled={isEnabling || isDisabling}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnableClick();
                    } else {
                      handleDisableClick();
                    }
                  }}
                />
              </div>
            )}
            {twoFactorEnabled && !isLoadingState && (
              <div className="flex flex-col gap-2">
                <Button
                  disabled={isGeneratingCodes}
                  loading={isGeneratingCodes}
                  onClick={handleRegenerateClick}
                  type="button"
                  variant="outline"
                >
                  Regenerate Backup Codes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            resetEnableDialog();
          }
        }}
        open={showEnableDialog}
      >
        <DialogContent className="max-w-md">
          {renderEnableDialogContent()}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowDisableDialog(false);
            setPassword("");
            setPasswordError(null);
          }
        }}
        open={showDisableDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable Two-Factor Authentication?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable two-factor authentication? This
              will make your account less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="disable-password">Password</Label>
              <div className="flex gap-0.5">
                <Input
                  aria-describedby={
                    passwordError ? "disable-password-error" : undefined
                  }
                  aria-invalid={!!passwordError}
                  autoComplete="current-password"
                  className="flex-1"
                  disabled={isDisabling}
                  id="disable-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) {
                      setPasswordError(null);
                    }
                  }}
                  placeholder="Enter your password…"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="size-10 shrink-0"
                  disabled={isDisabling}
                  onClick={() => setShowPassword(!showPassword)}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="outline"
                >
                  {showPassword ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <FieldError
                  errors={[{ message: passwordError }]}
                  id="disable-password-error"
                />
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              disabled={isDisabling}
              onClick={() => {
                setShowDisableDialog(false);
                setPassword("");
                setPasswordError(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <AlertDialogAction
              disabled={isDisabling || !password.trim()}
              onClick={handleDisableConfirm}
            >
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowBackupCodesDialog(false);
            setBackupCodes([]);
            setShowBackupCodes(false);
          }
        }}
        open={showBackupCodesDialog}
      >
        <DialogContent className="max-w-md">
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Backup Codes</DialogTitle>
              <DialogDescription>
                Save these codes in a safe place. You can use them to access
                your account if you lose your authenticator device.
              </DialogDescription>
            </DialogHeader>
            {backupCodes.length > 0 ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Backup Codes</Label>
                    <Button
                      onClick={copyBackupCodes}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <IconCopy className="size-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted p-4">
                    <div className="flex flex-col gap-2 font-mono text-sm">
                      {backupCodes.map((code) => (
                        <div key={code}>{code}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setShowBackupCodesDialog(false);
                      setBackupCodes([]);
                      setShowBackupCodes(false);
                    }}
                    type="button"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No backup codes available. Regenerate codes to view them.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowRegenerateDialog(false);
            setPassword("");
            setPasswordError(null);
          }
        }}
        open={showRegenerateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Backup Codes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate all your existing backup codes and generate
              new ones. Make sure to save the new codes in a safe place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="regenerate-password">Password</Label>
              <div className="flex gap-0.5">
                <Input
                  aria-describedby={
                    passwordError ? "regenerate-password-error" : undefined
                  }
                  aria-invalid={!!passwordError}
                  autoComplete="current-password"
                  className="flex-1"
                  disabled={isGeneratingCodes}
                  id="regenerate-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) {
                      setPasswordError(null);
                    }
                  }}
                  placeholder="Enter your password…"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="size-10 shrink-0"
                  disabled={isGeneratingCodes}
                  onClick={() => setShowPassword(!showPassword)}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="outline"
                >
                  {showPassword ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <FieldError
                  errors={[{ message: passwordError }]}
                  id="regenerate-password-error"
                />
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              disabled={isGeneratingCodes}
              onClick={() => {
                setShowRegenerateDialog(false);
                setPassword("");
                setPasswordError(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <AlertDialogAction
              disabled={isGeneratingCodes || !password.trim()}
              onClick={handleRegenerateConfirm}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
