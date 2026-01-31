"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LoginWithGoogle } from "@/components/authentication/login-with-google";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscores, and dots"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const nameUsernameSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, underscores, and dots"
    ),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SignUpForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const username = form.watch("username");

  useEffect(() => {
    const checkUsername = async () => {
      const trimmedUsername = username?.trim();
      if (!trimmedUsername || trimmedUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      if (!USERNAME_REGEX.test(trimmedUsername)) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data, error } = await authClient.isUsernameAvailable({
          username: trimmedUsername,
        });
        if (error) {
          setUsernameAvailable(null);
        } else {
          setUsernameAvailable(data?.available ?? false);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 300);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const validateStep = async (step: number): Promise<boolean> => {
    let schema:
      | typeof emailSchema
      | typeof nameUsernameSchema
      | typeof passwordSchema;
    if (step === 1) {
      schema = emailSchema;
    } else if (step === 2) {
      schema = nameUsernameSchema;
    } else {
      schema = passwordSchema;
    }

    const result = await form.trigger(
      Object.keys(schema.shape) as Array<keyof SignupFormData>
    );
    return result;
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/email/check?email=${encodeURIComponent(email)}`
      );

      let data: { available?: boolean; error?: string } | null = null;
      try {
        const text = await response.text();
        if (!text) {
          toast.error("Empty response from server");
          return false;
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error(
          response.ok
            ? "Invalid response from server"
            : `Failed to check email availability (${response.status})`
        );
        return false;
      }

      if (!response.ok) {
        const errorMessage =
          data?.error ||
          `Failed to check email availability (${response.status})`;
        toast.error(errorMessage);
        return false;
      }

      if (data && data.available === false) {
        toast.error("Email is already in use");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking email availability:", error);
      toast.error("Failed to check email availability");
      return false;
    }
  };

  const validateUsernameAvailability = (): boolean => {
    if (usernameAvailable === false) {
      toast.error("Username is not available");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      return;
    }

    if (currentStep === 1) {
      const email = form.getValues("email")?.trim();
      if (email) {
        setCheckingEmail(true);
        try {
          if (!(await checkEmailAvailability(email))) {
            return;
          }
        } finally {
          setCheckingEmail(false);
        }
      }
    }

    if (currentStep === 2 && !validateUsernameAvailability()) {
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: SignupFormData) => {
    const email = data.email?.trim();
    if (email && !(await checkEmailAvailability(email))) {
      return;
    }

    if (!validateUsernameAvailability()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        name: data.name,
        password: data.password,
        username: data.username.trim(),
      });

      if (result.error) {
        const errorMessage = getAuthErrorMessage(result.error, {
          type: "signup",
        });
        toast.error(errorMessage);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      const errorMessage = getAuthErrorMessage(
        error as { code?: string; message?: string } | null,
        { type: "signup" }
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const usernameFieldState = form.getFieldState("username");
  const showUsernameError =
    usernameFieldState.invalid || usernameAvailable === false;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      isInput
    ) {
      e.preventDefault();
      if (currentStep < 3) {
        await handleNext();
      } else {
        form.handleSubmit(onSubmit)();
      }
    }

    if (
      e.key === "ArrowLeft" &&
      currentStep > 1 &&
      (!isInput || (isInput && (target as HTMLInputElement).value === ""))
    ) {
      e.preventDefault();
      handleBack();
    }
  };

  return (
    <div className="flex flex-col">
      <form
        className="flex flex-col gap-6"
        onKeyDown={handleKeyDown}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4">
          {currentStep === 1 && (
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <Label
                    className="flex flex-col items-start gap-2"
                    htmlFor={field.name}
                  >
                    Email
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      autoFocus
                      disabled={isLoading || checkingEmail}
                      id={field.name}
                      placeholder="you@example.com"
                      type="email"
                    />
                  </Label>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>
              )}
            />
          )}

          {currentStep === 2 && (
            <>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      className="flex flex-col items-start gap-2"
                      htmlFor={field.name}
                    >
                      Name
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        autoComplete="name"
                        autoFocus
                        disabled={isLoading}
                        id={field.name}
                        placeholder="Your name"
                        type="text"
                      />
                    </Label>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      className="flex flex-col items-start gap-2"
                      htmlFor={field.name}
                    >
                      Username
                      <Input
                        {...field}
                        aria-invalid={showUsernameError}
                        autoComplete="username"
                        disabled={isLoading}
                        id={field.name}
                        placeholder="username"
                        type="text"
                      />
                    </Label>
                    {checkingUsername && (
                      <FieldDescription>
                        Checking availability…
                      </FieldDescription>
                    )}
                    {!checkingUsername &&
                      username &&
                      username.trim().length >= 3 &&
                      usernameAvailable !== null && (
                        <FieldDescription
                          className={
                            usernameAvailable
                              ? "text-green-600 dark:text-green-400"
                              : "text-destructive"
                          }
                        >
                          {usernameAvailable
                            ? "Username is available"
                            : "Username is not available"}
                        </FieldDescription>
                      )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                    {usernameAvailable === false && !fieldState.invalid && (
                      <FieldError
                        errors={[{ message: "Username is not available" }]}
                      />
                    )}
                  </div>
                )}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      className="flex flex-col items-start gap-2"
                      htmlFor={field.name}
                    >
                      Password
                      <div className="flex w-full gap-0.5">
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          autoComplete="new-password"
                          autoFocus
                          className="flex-1"
                          disabled={isLoading}
                          id={field.name}
                          placeholder="Create a password"
                          type={showPassword ? "text" : "password"}
                        />
                        <Button
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="size-10 shrink-0"
                          disabled={isLoading}
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
                    </Label>
                    {fieldState.invalid && fieldState.isTouched && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      className="flex flex-col items-start gap-2"
                      htmlFor={field.name}
                    >
                      Confirm Password
                      <div className="flex w-full gap-0.5">
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          autoComplete="new-password"
                          className="flex-1"
                          disabled={isLoading}
                          id={field.name}
                          placeholder="Confirm your password"
                          type={showConfirmPassword ? "text" : "password"}
                        />
                        <Button
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="size-10 shrink-0"
                          disabled={isLoading}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
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
                    </Label>
                    {fieldState.invalid && fieldState.isTouched && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </div>
                )}
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleBack}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                className="flex-1"
                disabled={
                  isLoading ||
                  checkingEmail ||
                  (currentStep === 2 && usernameAvailable === false)
                }
                loading={isLoading || checkingEmail}
                onClick={handleNext}
                type="button"
              >
                {currentStep === 1 ? "Continue with email" : "Next"}
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={isLoading || usernameAvailable === false}
                loading={isLoading}
                type="submit"
              >
                Create account
              </Button>
            )}
          </div>
          {currentStep === 1 && (
            <>
              <div className="text-center font-semibold text-muted-foreground text-sm">
                OR
              </div>
              <LoginWithGoogle />
            </>
          )}
        </div>
      </form>
    </div>
  );
}
