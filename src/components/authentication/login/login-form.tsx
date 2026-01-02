"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { LoginWithGoogle } from "../login-with-google";
import { LoginWithPasskey } from "../login-with-passkey";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmail = (value: string) => {
  return EMAIL_REGEX.test(value);
};

const getMethodDisplayName = (method: string | null | undefined): string => {
  if (!method) {
    return "";
  }
  const methodMap: Record<string, string> = {
    email: "Email",
    google: "Google",
    passkey: "Passkey",
  };
  return methodMap[method] || method;
};

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const lastUsedMethod = authClient.getLastUsedLoginMethod();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  // Conditional UI support for passkey autofill
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      const checkConditionalUI = async () => {
        try {
          const available =
            await PublicKeyCredential.isConditionalMediationAvailable();
          if (available) {
            authClient.signIn.passkey({ autoFill: true }).catch(() => {
              // Ignore errors for conditional UI
            });
          }
        } catch {
          // Conditional UI not available, ignore
        }
      };
      checkConditionalUI().catch(() => {
        // Ignore errors for conditional UI check
      });
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const identifier = data.identifier.trim();
      const isEmailFormat = isEmail(identifier);

      const result = isEmailFormat
        ? await authClient.signIn.email({
            email: identifier,
            password: data.password,
            rememberMe: data.rememberMe,
          })
        : await authClient.signIn.username({
            username: identifier,
            password: data.password,
          });

      if (result.error) {
        toast.error(result.error.message || "Invalid credentials");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailForm = (showHelperText: boolean) => (
    <div className="flex flex-col gap-4">
      <Controller
        control={form.control}
        name="identifier"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label
              className="flex flex-col items-start gap-2"
              htmlFor={field.name}
            >
              Email or Username
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="username webauthn"
                disabled={isLoading}
                id={field.name}
                placeholder="you@example.com or username"
                type="text"
              />
            </Label>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        )}
      />
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
                  autoComplete="current-password webauthn"
                  className="flex-1"
                  disabled={isLoading}
                  id={field.name}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        )}
      />
      <Controller
        control={form.control}
        name="rememberMe"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label
              className="flex items-center gap-2 font-normal"
              htmlFor={field.name}
            >
              <Checkbox
                aria-invalid={fieldState.invalid}
                checked={field.value}
                disabled={isLoading}
                id={field.name}
                name={field.name}
                onCheckedChange={field.onChange}
              />
              Remember me
            </Label>
          </div>
        )}
      />
      <div className="flex flex-col gap-1">
        <Button
          disabled={isLoading}
          loading={isLoading}
          type="submit"
          variant={
            lastUsedMethod === "email" || !lastUsedMethod
              ? "default"
              : "outline"
          }
        >
          Sign in
        </Button>
        {showHelperText && lastUsedMethod === "email" && (
          <p className="py-4 text-center font-medium text-muted-foreground text-sm">
            You last used {getMethodDisplayName(lastUsedMethod)} to sign in
          </p>
        )}
      </div>
    </div>
  );

  const renderLoginMethods = () => {
    if (lastUsedMethod === "email") {
      return (
        <>
          {renderEmailForm(true)}
          <LoginWithGoogle variant="outline" />
          <LoginWithPasskey variant="outline" />
        </>
      );
    }
    if (lastUsedMethod === "google") {
      return (
        <>
          <LoginWithGoogle showHelperText variant="default" />
          {renderEmailForm(false)}
          <LoginWithPasskey variant="outline" />
        </>
      );
    }
    if (lastUsedMethod === "passkey") {
      return (
        <>
          <LoginWithPasskey showHelperText variant="default" />
          {renderEmailForm(false)}
          <LoginWithGoogle variant="outline" />
        </>
      );
    }
    return (
      <>
        {renderEmailForm(false)}
        <LoginWithGoogle variant="outline" />
        <LoginWithPasskey variant="outline" />
      </>
    );
  };

  return (
    <div className="flex flex-col">
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {renderLoginMethods()}
      </form>
    </div>
  );
}
