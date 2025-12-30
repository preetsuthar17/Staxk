"use client";

import { IconEye, IconEyeOff, IconFingerprint } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/ui/google-logo";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { authClient, signIn } from "@/lib/auth-client";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLoginButtonText(
  loading: boolean,
  showPasswordField: boolean
): React.ReactNode {
  if (loading) {
    return <Spinner />;
  }
  if (showPasswordField) {
    return "Sign in";
  }
  return "Continue";
}

function GoogleButton({
  loading,
  googleLoading,
  onClick,
  variant,
}: {
  loading: boolean;
  googleLoading: boolean;
  onClick: () => void;
  variant: "default" | "outline";
}) {
  return (
    <div className="p-1">
      <Button
        aria-label={
          googleLoading
            ? "Signing in with Google, please wait"
            : "Sign in with Google"
        }
        className="w-full"
        disabled={loading || googleLoading}
        onClick={onClick}
        type="button"
        variant={variant}
      >
        {googleLoading ? (
          <Spinner />
        ) : (
          <span className="flex items-center gap-3 font-medium">
            <GoogleLogo className="size-4" /> Sign in with Google
          </span>
        )}
      </Button>
    </div>
  );
}

function PasswordFieldSection({
  showPassword,
  password,
  rememberMe,
  loading,
  onPasswordChange,
  onPasswordKeyDown,
  onShowPasswordToggle,
  onRememberMeChange,
}: {
  showPassword: boolean;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onShowPasswordToggle: () => void;
  onRememberMeChange: (checked: boolean) => void;
}) {
  return (
    <>
      <Label className="flex flex-col items-start gap-2 p-1" htmlFor="password">
        <span className="text-muted-foreground text-sm">
          Enter your password
        </span>
        <InputGroup className="animate-password-entry">
          <InputGroupInput
            autoComplete="current-password"
            disabled={loading}
            id="password"
            onChange={onPasswordChange}
            onKeyDown={onPasswordKeyDown}
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <InputGroupButton
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="-mt-0.5 h-9.5 w-9.5 rounded-sm"
            onClick={onShowPasswordToggle}
            tabIndex={-1}
            type="button"
            variant="ghost"
          >
            {showPassword ? (
              <IconEyeOff className="size-4" />
            ) : (
              <IconEye className="size-4" />
            )}
          </InputGroupButton>
        </InputGroup>
      </Label>
      <div className="flex items-center justify-between px-1 py-2">
        <Label
          className="flex cursor-pointer items-center gap-2"
          htmlFor="remember-me"
        >
          <Checkbox
            checked={rememberMe}
            disabled={loading}
            id="remember-me"
            onCheckedChange={(checked) => onRememberMeChange(checked === true)}
          />
          <span className="text-muted-foreground text-sm">Remember me</span>
        </Label>
        <Link
          className="text-muted-foreground text-sm hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
    </>
  );
}

function PasskeyButton({
  loading,
  passkeyLoading,
  onClick,
  variant = "outline",
}: {
  loading: boolean;
  passkeyLoading: boolean;
  onClick: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <div className="p-1">
      <Button
        className="w-full"
        disabled={loading || passkeyLoading}
        onClick={onClick}
        type="button"
        variant={variant}
      >
        {passkeyLoading ? (
          <Spinner />
        ) : (
          <span className="flex items-center gap-3 font-medium">
            <IconFingerprint className="size-4" />
            Sign in with passkey
          </span>
        )}
      </Button>
    </div>
  );
}

function LastUsedMethodMessage({
  methodDisplayName,
}: {
  methodDisplayName: string | null;
}) {
  if (!methodDisplayName) {
    return null;
  }
  return (
    <p className="pb-4 text-center font-medium text-muted-foreground text-sm">
      You last used {methodDisplayName} to login
    </p>
  );
}

function getMethodDisplayName(method: string | null): string | null {
  if (method === "google") {
    return "Google";
  }
  if (method === "email") {
    return "Email";
  }
  if (method === "passkey") {
    return "Passkey";
  }
  return null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (
      err.message.includes("ERR_RESPONSE_HEADERS_TOO_BIG") ||
      err.message.includes("headers too big")
    ) {
      return "Authentication cookies have been cleared. Please try logging in again.";
    }
    return err.message;
  }
  return "Network error. Please check your connection and try again.";
}

function showErrorToast(err: unknown) {
  toast.error(getErrorMessage(err));
}

function handleEmailSignInSuccess(
  data: unknown,
  router: ReturnType<typeof useRouter>
) {
  if (data && typeof data === "object" && "twoFactorRedirect" in data) {
    const redirectData = data as { twoFactorRedirect?: boolean };
    if (redirectData.twoFactorRedirect) {
      router.push("/login?verify=2fa");
      return;
    }
  }
  router.push("/");
  router.refresh();
}

async function performEmailSignIn(
  email: string,
  password: string,
  rememberMe: boolean
) {
  const { data, error } = await signIn.email({
    email,
    password,
    rememberMe,
  });

  if (error) {
    toast.error(error.message || "Something went wrong. Please try again.");
    return { success: false };
  }

  return { success: true, data };
}

function handleGoogleSignInError(err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : "Network error. Please check your connection and try again.";
  toast.error(message);
}

async function performGoogleSignIn() {
  const { error } = await signIn.social({ provider: "google" });
  if (error) {
    toast.error(
      error.message || "Failed to sign in with Google. Please try again."
    );
    return { success: false };
  }
  return { success: true };
}

function handlePasskeySignInError(err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : "Failed to sign in with passkey. Please try again.";
  toast.error(message);
}

async function performPasskeySignIn() {
  const { error } = await authClient.signIn.passkey();
  if (error) {
    toast.error(
      error.message || "Failed to sign in with passkey. Please try again."
    );
    return { success: false };
  }
  return { success: true };
}

export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);

  const lastMethod = authClient.getLastUsedLoginMethod();
  const methodDisplayName = getMethodDisplayName(lastMethod);
  const showGoogleFirst = lastMethod === "google";
  const showPasskeyFirst = lastMethod === "passkey";

  useEffect(() => {
    const checkPasskeySupport = async () => {
      if (
        typeof window !== "undefined" &&
        window.PublicKeyCredential &&
        PublicKeyCredential.isConditionalMediationAvailable
      ) {
        const available =
          await PublicKeyCredential.isConditionalMediationAvailable();
        setPasskeySupported(available);
      }
    };
    checkPasskeySupport();
  }, []);

  useEffect(() => {
    if (showPasswordField) {
      const timer = setTimeout(() => {
        document.getElementById("password")?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPasswordField]);

  const validateEmail = (email: string) => EMAIL_REGEX.test(email);

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const shouldGoBack =
      e.key === "Escape" ||
      e.key === "ArrowUp" ||
      (e.key === "ArrowLeft" &&
        (e.currentTarget.selectionStart === 0 || !e.currentTarget.value));
    if (shouldGoBack) {
      e.preventDefault();
      setTimeout(() => {
        document.getElementById("email")?.focus();
      }, 50);
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setShowPasswordField(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await performEmailSignIn(email, password, rememberMe);
      if (result.success && result.data) {
        handleEmailSignInSuccess(result.data, router);
      } else {
        setLoading(false);
      }
    } catch (err) {
      showErrorToast(err);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await performGoogleSignIn();
    } catch (err) {
      handleGoogleSignInError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true);
    try {
      const result = await performPasskeySignIn();
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setPasskeyLoading(false);
      }
    } catch (err) {
      handlePasskeySignInError(err);
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-xs flex-col gap-8 bg-transparent">
      <div className="flex flex-col items-center justify-center gap-4">
        <Image alt="Staxk Logo" height={38} src="/logo.svg" width={38} />
        <h1 className="text-center font-medium text-xl">Login to Staxk</h1>
      </div>

      <div className="flex flex-col gap-2">
        {showPasskeyFirst && passkeySupported && (
          <>
            <PasskeyButton
              loading={loading || googleLoading}
              onClick={handlePasskeySignIn}
              passkeyLoading={passkeyLoading}
              variant="default"
            />
            <LastUsedMethodMessage methodDisplayName={methodDisplayName} />
          </>
        )}

        {showGoogleFirst && (
          <>
            <GoogleButton
              googleLoading={googleLoading}
              loading={loading}
              onClick={handleGoogleSignIn}
              variant="default"
            />
            <LastUsedMethodMessage methodDisplayName={methodDisplayName} />
          </>
        )}

        <form
          aria-busy={loading}
          className={`flex flex-col ${showPasswordField ? "gap-2" : "gap-0.5"}`}
          onSubmit={showPasswordField ? handleSubmit : handleEmailContinue}
        >
          <Label
            className="flex flex-col items-start gap-2 p-1"
            htmlFor="email"
          >
            <span className="text-muted-foreground text-sm">
              Enter your email
            </span>
            <Input
              autoComplete="email"
              autoFocus
              disabled={loading || googleLoading}
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </Label>

          <div
            className={`password-field-wrapper ${showPasswordField ? "expanded" : ""}`}
          >
            {showPasswordField && (
              <PasswordFieldSection
                loading={loading}
                onPasswordChange={(e) => setPassword(e.target.value)}
                onPasswordKeyDown={handlePasswordKeyDown}
                onRememberMeChange={(checked) => setRememberMe(checked)}
                onShowPasswordToggle={() => setShowPassword(!showPassword)}
                password={password}
                rememberMe={rememberMe}
                showPassword={showPassword}
              />
            )}
          </div>

          <div className="p-1">
            <Button
              className="w-full"
              disabled={
                loading || googleLoading || !(showPasswordField || email)
              }
              type="submit"
            >
              {getLoginButtonText(loading, showPasswordField)}
            </Button>
          </div>
        </form>

        {!(showGoogleFirst || showPasskeyFirst) && (
          <LastUsedMethodMessage methodDisplayName={methodDisplayName} />
        )}

        {!showGoogleFirst && (
          <GoogleButton
            googleLoading={googleLoading}
            loading={loading}
            onClick={handleGoogleSignIn}
            variant="outline"
          />
        )}

        {passkeySupported && !showPasskeyFirst && (
          <PasskeyButton
            loading={loading || googleLoading}
            onClick={handlePasskeySignIn}
            passkeyLoading={passkeyLoading}
            variant="outline"
          />
        )}
      </div>
      <p className="text-center text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        <Link
          className="font-medium text-foreground hover:underline"
          href="/signup"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
