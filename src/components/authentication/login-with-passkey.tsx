"use client";

import { IconFingerprint } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

interface LoginWithPasskeyProps {
  variant?: ComponentProps<typeof Button>["variant"];
  showHelperText?: boolean;
}

const isCancellationError = (message: string | null | undefined): boolean => {
  if (!message) {
    return false;
  }
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("cancel") ||
    lowerMessage.includes("notallowed") ||
    lowerMessage.includes("abort")
  );
};

const isInvalidError = (message: string | null | undefined): boolean => {
  if (!message) {
    return false;
  }
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("wrong") ||
    lowerMessage.includes("failed")
  );
};

const handleErrorResult = (
  error: {
    code?: string;
    message?: string | null;
  } | null
) => {
  if (!error) {
    return;
  }

  if (isCancellationError(error.message)) {
    toast.error("Passkey authentication was cancelled");
    return;
  }

  if (isInvalidError(error.message)) {
    toast.error("Invalid passkey. Please try again.");
    return;
  }

  const errorMessage = getAuthErrorMessage(error);
  toast.error(errorMessage);
};

const handleCaughtError = (error: unknown) => {
  if (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" ||
      error.name === "AbortError" ||
      isCancellationError(error.message))
  ) {
    toast.error("Passkey authentication was cancelled");
    return;
  }

  if (error instanceof Error) {
    if (isInvalidError(error.message)) {
      toast.error("Invalid passkey. Please try again.");
      return;
    }

    const errorMessage = getAuthErrorMessage({ message: error.message }, null);
    toast.error(errorMessage);
    return;
  }

  toast.error("Something went wrong. Please try again.");
};

export function LoginWithPasskey({
  variant = "outline",
  showHelperText = false,
}: LoginWithPasskeyProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.passkey({
        autoFill: false,
      });

      if (result.error) {
        setIsLoading(false);
        handleErrorResult(result.error);
        return;
      }

      // Check if 2FA verification is required
      if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      ) {
        router.push("/two-factor-verify");
        return;
      }

      toast.success("Signed in successfully");
      router.push("/home");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      handleCaughtError(error);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        className="w-full gap-2"
        disabled={isLoading}
        loading={isLoading}
        onClick={handlePasskeySignIn}
        type="button"
        variant={variant}
      >
        <IconFingerprint />
        Sign in with Passkey
      </Button>
      {showHelperText && (
        <p className="py-4 text-center font-medium text-muted-foreground text-sm">
          You last used Passkey to sign in
        </p>
      )}
    </div>
  );
}
