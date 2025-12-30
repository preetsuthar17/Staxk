"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { changePassword } from "@/lib/auth-client";
import { safeClientError } from "@/lib/client-logger";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .trim(),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  error?: string;
  errorId?: string;
  register: ReturnType<typeof useForm<ChangePasswordFormData>>["register"];
  disabled: boolean;
}

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  showPassword,
  onTogglePassword,
  error,
  errorId,
  register,
  disabled,
}: PasswordFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label className="font-normal text-sm" htmlFor={id}>
        {label}
      </Label>
      <InputGroup>
        <InputGroupInput
          autoComplete={autoComplete}
          id={id}
          {...register(id as keyof ChangePasswordFormData)}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : "false"}
          disabled={disabled}
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
        />
        <InputGroupButton
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="w-9 hover:bg-transparent"
          onClick={onTogglePassword}
          size={"icon-sm"}
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
      {error && (
        <p className="mt-1 text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ChangePassword() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewAndConfirmPassword, setShowNewAndConfirmPassword] =
    useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions,
      });

      if (error) {
        throw new Error(error.message || "Failed to change password");
      }

      toast.success("Password changed successfully");
      reset();
      router.refresh();
    } catch (error) {
      safeClientError("Error changing password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleShowNewAndConfirmPassword = () => {
    setShowNewAndConfirmPassword((prev) => !prev);
  };

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <Label className="font-medium text-base" htmlFor="current-password">
        Change password
      </Label>
      <form
        className="flex w-full flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <PasswordField
          autoComplete="current-password"
          disabled={isSubmitting}
          error={errors.currentPassword?.message}
          errorId="current-password-error"
          id="currentPassword"
          label="Current password"
          onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
          placeholder="Enter your current password"
          register={register}
          showPassword={showCurrentPassword}
        />

        <PasswordField
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.newPassword?.message}
          errorId="new-password-error"
          id="newPassword"
          label="New password"
          onTogglePassword={handleToggleShowNewAndConfirmPassword}
          placeholder="Enter your new password"
          register={register}
          showPassword={showNewAndConfirmPassword}
        />

        <PasswordField
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          errorId="confirm-password-error"
          id="confirmPassword"
          label="Confirm new password"
          onTogglePassword={handleToggleShowNewAndConfirmPassword}
          placeholder="Confirm your new password"
          register={register}
          showPassword={showNewAndConfirmPassword}
        />

        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={revokeOtherSessions}
              disabled={isSubmitting}
              id="revoke-other-sessions"
              onCheckedChange={(checked) =>
                setRevokeOtherSessions(checked === true)
              }
            />
            <Label
              className="cursor-pointer font-normal text-sm"
              htmlFor="revoke-other-sessions"
            >
              Log out from all other devices
            </Label>
          </div>

          <div className="flex items-center justify-end">
            <Button className="h-9" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                "Change password"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
