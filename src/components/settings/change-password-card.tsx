"use client";

import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
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
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const ERROR_KEYWORDS = {
  INCORRECT: ["incorrect", "wrong", "invalid password"],
  DIFFERENT: ["different", "same password"],
  LENGTH: ["length"],
  REQUIRED: ["required"],
};

// Helper functions to reduce complexity
function hasKeyword(errorLower: string, keywords: string[]): boolean {
  return keywords.some((keyword) => errorLower.includes(keyword));
}

function categorizeRequiredError(errorLower: string): string | null {
  if (!hasKeyword(errorLower, ERROR_KEYWORDS.REQUIRED)) {
    return null;
  }
  if (errorLower.includes("current")) {
    return "currentPassword";
  }
  if (errorLower.includes("new")) {
    return "newPassword";
  }
  return null;
}

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCurrent) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!trimmedNew) {
      newErrors.newPassword = "New password is required";
    } else if (
      trimmedNew.length < MIN_PASSWORD_LENGTH ||
      trimmedNew.length > MAX_PASSWORD_LENGTH
    ) {
      newErrors.newPassword = `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`;
    } else if (trimmedCurrent && trimmedNew === trimmedCurrent) {
      newErrors.newPassword =
        "New password must be different from your current password";
    }

    if (!trimmedConfirm) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [currentPassword, newPassword, confirmPassword]);

  const focusField = useCallback((fieldId: string) => {
    setTimeout(() => {
      document.getElementById(fieldId)?.focus();
    }, 0);
  }, []);

  const categorizeError = useCallback((errorMessage: string) => {
    const errorLower = errorMessage.toLowerCase();

    if (hasKeyword(errorLower, ERROR_KEYWORDS.INCORRECT)) {
      return "currentPassword";
    }
    if (
      hasKeyword(errorLower, ERROR_KEYWORDS.DIFFERENT) ||
      (errorLower.includes("new password") && errorLower.includes("must be"))
    ) {
      return "newPassword";
    }
    if (
      hasKeyword(errorLower, ERROR_KEYWORDS.LENGTH) &&
      errorLower.includes("password")
    ) {
      return "newPassword";
    }
    return categorizeRequiredError(errorLower);
  }, []);

  const changePassword = useCallback(
    async (revokeOtherSessions: boolean) => {
      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch("/api/user/password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
            revokeOtherSessions,
          }),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
          const errorMessage =
            data.error || "Failed to change password. Please try again.";
          toast.error(errorMessage);

          const errorField = categorizeError(errorMessage);
          if (errorField) {
            setErrors({ [errorField]: errorMessage });
            focusField(errorField);
          }
          return;
        }

        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        setShowRevokeDialog(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentPassword, newPassword, categorizeError, focusField]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const validation = validateForm();
      if (!validation.isValid) {
        const firstErrorField = Object.keys(validation.errors)[0];
        if (firstErrorField) {
          focusField(firstErrorField);
        }
        return;
      }

      setShowRevokeDialog(true);
    },
    [validateForm, focusField]
  );

  const handleCurrentPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentPassword(e.target.value);
      if (errors.currentPassword) {
        setErrors((prev) => ({ ...prev, currentPassword: undefined }));
      }
    },
    [errors.currentPassword]
  );

  const handleNewPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setNewPassword(newValue);

      const trimmedCurrent = currentPassword.trim();
      const trimmedNew = newValue.trim();

      if (
        errors.newPassword &&
        (trimmedNew !== trimmedCurrent || !trimmedCurrent)
      ) {
        setErrors((prev) => ({ ...prev, newPassword: undefined }));
      }

      if (trimmedCurrent && trimmedNew === trimmedCurrent) {
        setErrors((prev) => ({
          ...prev,
          newPassword:
            "New password must be different from your current password",
        }));
      }

      if (errors.confirmPassword && confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            newValue === confirmPassword ? undefined : "Passwords do not match",
        }));
      }
    },
    [
      currentPassword,
      confirmPassword,
      errors.newPassword,
      errors.confirmPassword,
    ]
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setConfirmPassword(newValue);
      if (errors.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            newValue === newPassword ? undefined : "Passwords do not match",
        }));
      }
    },
    [newPassword, errors.confirmPassword]
  );

  const toggleCurrentPassword = useCallback(
    () => setShowCurrentPassword((prev) => !prev),
    []
  );
  const toggleNewPassword = useCallback(
    () => setShowNewPassword((prev) => !prev),
    []
  );
  const toggleConfirmPassword = useCallback(
    () => setShowConfirmPassword((prev) => !prev),
    []
  );

  const isSubmitDisabled = useMemo(() => isLoading, [isLoading]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="flex gap-0.5">
                <Input
                  aria-describedby={
                    errors.currentPassword ? "currentPassword-error" : undefined
                  }
                  aria-invalid={!!errors.currentPassword}
                  autoComplete="current-password"
                  className="flex-1"
                  disabled={isLoading}
                  id="currentPassword"
                  onChange={handleCurrentPasswordChange}
                  placeholder="Enter your current password…"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                />
                <Button
                  aria-label={
                    showCurrentPassword ? "Hide password" : "Show password"
                  }
                  className="size-10 shrink-0"
                  disabled={isLoading}
                  onClick={toggleCurrentPassword}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="outline"
                >
                  {showCurrentPassword ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <FieldError
                  errors={[{ message: errors.currentPassword }]}
                  id="currentPassword-error"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="flex gap-0.5">
                <Input
                  aria-describedby={
                    errors.newPassword ? "newPassword-error" : undefined
                  }
                  aria-invalid={!!errors.newPassword}
                  autoComplete="new-password"
                  className="flex-1"
                  disabled={isLoading}
                  id="newPassword"
                  onChange={handleNewPasswordChange}
                  placeholder="Enter your new password…"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                />
                <Button
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                  className="size-10 shrink-0"
                  disabled={isLoading}
                  onClick={toggleNewPassword}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="outline"
                >
                  {showNewPassword ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <FieldError
                  errors={[{ message: errors.newPassword }]}
                  id="newPassword-error"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="flex gap-0.5">
                <Input
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  aria-invalid={!!errors.confirmPassword}
                  autoComplete="new-password"
                  className="flex-1"
                  disabled={isLoading}
                  id="confirmPassword"
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your new password…"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                />
                <Button
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="size-10 shrink-0"
                  disabled={isLoading}
                  onClick={toggleConfirmPassword}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="outline"
                >
                  {showConfirmPassword ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <FieldError
                  errors={[{ message: errors.confirmPassword }]}
                  id="confirmPassword-error"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={isSubmitDisabled}
                loading={isLoading}
                type="submit"
              >
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setShowRevokeDialog} open={showRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out of Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to log out from all other devices and sessions? This
              will invalidate all active sessions except for this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => changePassword(false)}
              variant="outline"
            >
              Keep Me Logged In
            </Button>
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => changePassword(true)}
            >
              Log Out of Other Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
