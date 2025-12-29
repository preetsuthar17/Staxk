"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authClient, useSession } from "@/lib/auth-client";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

type SetupStep = "password" | "qr" | "verify" | "backup";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className="h-8 w-8"
      onClick={handleCopy}
      size="icon"
      type="button"
      variant="ghost"
    >
      {copied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Copy className="size-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function QRCodeDisplay({ totpUri }: { totpUri: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(totpUri, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    };
    generateQR();
  }, [totpUri]);

  if (!qrDataUrl) {
    return (
      <div className="flex h-[200px] w-[200px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Image
      alt="QR Code for authenticator app"
      className="rounded-lg"
      height={200}
      src={qrDataUrl}
      unoptimized
      width={200}
    />
  );
}

function BackupCodesDisplay({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    toast.success("Backup codes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <div
            className="rounded-md bg-muted px-3 py-2 font-mono text-sm"
            key={code}
          >
            {code}
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        onClick={handleCopyAll}
        type="button"
        variant="outline"
      >
        {copied ? (
          <>
            <Check className="mr-2 size-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 size-4" />
            Copy all codes
          </>
        )}
      </Button>
    </div>
  );
}

function PasswordStep({
  form,
  isLoading,
  showPassword,
  onPasswordToggle,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<PasswordFormData>>;
  isLoading: boolean;
  showPassword: boolean;
  onPasswordToggle: () => void;
  onSubmit: (data: PasswordFormData) => void;
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <InputGroup>
          <InputGroupInput
            {...form.register("password")}
            autoComplete="current-password"
            disabled={isLoading}
            id="password"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
          />
          <InputGroupButton
            className="w-9 hover:bg-transparent"
            onClick={onPasswordToggle}
            size="icon-sm"
            tabIndex={-1}
            type="button"
            variant="ghost"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </InputGroupButton>
        </InputGroup>
        {form.formState.errors.password && (
          <p className="text-destructive text-xs">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button disabled={isLoading} type="submit">
          {isLoading ? <Spinner className="size-4" /> : "Continue"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function QRStep({ totpUri, onNext }: { totpUri: string; onNext: () => void }) {
  const secret = totpUri.split("secret=")[1]?.split("&")[0] || "";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-2">
        <QRCodeDisplay totpUri={totpUri} />
      </div>
      <div className="flex w-full items-center gap-2">
        <Input className="font-mono text-xs" readOnly value={secret} />
        <CopyButton label="Copy secret" text={secret} />
      </div>
      <p className="text-center text-muted-foreground text-sm">
        Can&apos;t scan? Copy the secret key manually.
      </p>
      <DialogFooter className="w-full">
        <Button className="w-full" onClick={onNext}>
          I&apos;ve scanned the code
        </Button>
      </DialogFooter>
    </div>
  );
}

function VerifyStep({
  form,
  isLoading,
  onBack,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<VerifyCodeFormData>>;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (data: VerifyCodeFormData) => void;
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          {...form.register("code")}
          autoComplete="one-time-code"
          className="text-center font-mono text-lg tracking-widest"
          disabled={isLoading}
          id="code"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]*"
          placeholder="000000"
        />
        {form.formState.errors.code && (
          <p className="text-destructive text-xs">
            {form.formState.errors.code.message}
          </p>
        )}
      </div>
      <DialogFooter className="flex gap-2">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button disabled={isLoading} type="submit">
          {isLoading ? <Spinner className="size-4" /> : "Verify"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BackupStep({
  codes,
  onComplete,
}: {
  codes: string[];
  onComplete: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <BackupCodesDisplay codes={codes} />
      <DialogFooter>
        <Button className="w-full" onClick={onComplete}>
          I&apos;ve saved my backup codes
        </Button>
      </DialogFooter>
    </div>
  );
}

function getStepTitle(step: SetupStep): string {
  if (step === "password") {
    return "Enable Two-Factor Authentication";
  }
  if (step === "qr") {
    return "Scan QR Code";
  }
  if (step === "verify") {
    return "Verify Code";
  }
  return "Backup Codes";
}

function getStepDescription(step: SetupStep): string {
  if (step === "password") {
    return "Enter your password to continue.";
  }
  if (step === "qr") {
    return "Scan this QR code with your authenticator app.";
  }
  if (step === "verify") {
    return "Enter the 6-digit code from your app.";
  }
  return "Save these backup codes in a safe place. You can use them to access your account if you lose your device.";
}

function EnableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const verifyForm = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  const resetDialog = () => {
    setStep("password");
    setTotpUri(null);
    setBackupCodes([]);
    passwordForm.reset();
    verifyForm.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await authClient.twoFactor.enable({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Failed to enable 2FA");
        return;
      }

      if (result?.totpURI) {
        setTotpUri(result.totpURI);
        setBackupCodes(result.backupCodes || []);
        setStep("qr");
      }
    } catch {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (data: VerifyCodeFormData) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: data.code,
      });

      if (error) {
        toast.error(error.message || "Invalid code");
        return;
      }

      setStep("backup");
    } catch {
      toast.error("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    toast.success("Two-factor authentication enabled");
    handleOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            {getStepTitle(step)}
          </DialogTitle>
          <DialogDescription>{getStepDescription(step)}</DialogDescription>
        </DialogHeader>

        {step === "password" && (
          <PasswordStep
            form={passwordForm}
            isLoading={isLoading}
            onPasswordToggle={() => setShowPassword(!showPassword)}
            onSubmit={handlePasswordSubmit}
            showPassword={showPassword}
          />
        )}

        {step === "qr" && totpUri && (
          <QRStep onNext={() => setStep("verify")} totpUri={totpUri} />
        )}

        {step === "verify" && (
          <VerifyStep
            form={verifyForm}
            isLoading={isLoading}
            onBack={() => setStep("qr")}
            onSubmit={handleVerifySubmit}
          />
        )}

        {step === "backup" && backupCodes.length > 0 && (
          <BackupStep codes={backupCodes} onComplete={handleComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableTwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const handleSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("Two-factor authentication disabled");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="size-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter your password to disable two-factor authentication. Your
            account will be less secure.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="disable-password">Password</Label>
            <InputGroup>
              <InputGroupInput
                {...form.register("password")}
                autoComplete="current-password"
                disabled={isLoading}
                id="disable-password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
              />
              <InputGroupButton
                className="w-9 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                size="icon-sm"
                tabIndex={-1}
                type="button"
                variant="ghost"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </InputGroupButton>
            </InputGroup>
            {form.formState.errors.password && (
              <p className="text-destructive text-xs">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isLoading} type="submit" variant="destructive">
              {isLoading ? <Spinner className="size-4" /> : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateBackupCodesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<"password" | "codes">("password");

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("password");
      setBackupCodes([]);
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { data: result, error } =
        await authClient.twoFactor.generateBackupCodes({
          password: data.password,
        });

      if (error) {
        toast.error(error.message || "Failed to generate backup codes");
        return;
      }

      if (result?.backupCodes) {
        setBackupCodes(result.backupCodes);
        setStep("codes");
      }
    } catch {
      toast.error("Failed to generate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5" />
            Regenerate Backup Codes
          </DialogTitle>
          <DialogDescription>
            {step === "password"
              ? "This will invalidate your existing backup codes."
              : "Save these new backup codes in a safe place."}
          </DialogDescription>
        </DialogHeader>

        {step === "password" && (
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="regen-password">Password</Label>
              <InputGroup>
                <InputGroupInput
                  {...form.register("password")}
                  autoComplete="current-password"
                  disabled={isLoading}
                  id="regen-password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <InputGroupButton
                  className="w-9 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  size="icon-sm"
                  tabIndex={-1}
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroup>
              {form.formState.errors.password && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? <Spinner className="size-4" /> : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "codes" && backupCodes.length > 0 && (
          <div className="flex flex-col gap-4">
            <BackupCodesDisplay codes={backupCodes} />
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TwoFactorSettings() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);

  const is2FAEnabled = session?.user?.twoFactorEnabled;

  const handleSuccess = () => {
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <Label className="font-medium text-base">
          Two-factor authentication
        </Label>
        {is2FAEnabled ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <ShieldCheck className="size-4" />
            Enabled
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <ShieldOff className="size-4" />
            Disabled
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Add an extra layer of security to your account by requiring a
        verification code in addition to your password when signing in.
      </p>

      <div className="flex w-full flex-wrap gap-3">
        {is2FAEnabled ? (
          <>
            <Button
              className="w-fit justify-start"
              onClick={() => setShowBackupCodesDialog(true)}
              variant="outline"
            >
              <RefreshCw className="size-4" />
              Regenerate backup codes
            </Button>
            <Button
              className="w-fit justify-start text-destructive hover:text-destructive"
              onClick={() => setShowDisableDialog(true)}
              variant="outline"
            >
              <ShieldOff className="size-4" />
              Disable 2FA
            </Button>
          </>
        ) : (
          <Button
            className="w-fit justify-start"
            onClick={() => setShowEnableDialog(true)}
            variant="outline"
          >
            <Shield className="size-4" />
            Enable 2FA
          </Button>
        )}
      </div>

      <EnableTwoFactorDialog
        onOpenChange={setShowEnableDialog}
        onSuccess={handleSuccess}
        open={showEnableDialog}
      />

      <DisableTwoFactorDialog
        onOpenChange={setShowDisableDialog}
        onSuccess={handleSuccess}
        open={showDisableDialog}
      />

      <RegenerateBackupCodesDialog
        onOpenChange={setShowBackupCodesDialog}
        open={showBackupCodesDialog}
      />
    </div>
  );
}
