"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleSignupButton({
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
            ? "Signing up with Google, please wait"
            : "Sign up with Google"
        }
        className="w-full"
        disabled={loading || googleLoading}
        onClick={onClick}
        type="button"
        variant={variant}
      >
        {googleLoading ? <Spinner /> : "Sign up with Google"}
      </Button>
    </div>
  );
}

function getMethodDisplayName(lastMethod: string | null): string | null {
  if (lastMethod === "google") {
    return "Google";
  }
  if (lastMethod === "email") {
    return "Email";
  }
  return null;
}

function getButtonText(loading: boolean, currentStep: number): React.ReactNode {
  if (loading) {
    return <Spinner />;
  }
  if (currentStep === 3) {
    return "Sign up";
  }
  return "Continue";
}

export function SignupCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const lastMethod = authClient.getLastUsedLoginMethod();
  const methodDisplayName = getMethodDisplayName(lastMethod);
  const showGoogleFirst = lastMethod === "google";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else {
        const inputIds = ["name", "email", "password", "confirm-password"];
        const inputId = inputIds[currentStep];
        if (inputId) {
          const input = document.getElementById(inputId) as HTMLInputElement;
          if (input) {
            input.focus();
            inputRef.current = input;
          }
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
  };

  const validateEmail = (email: string) => EMAIL_REGEX.test(email);

  const validateStep0 = () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    return true;
  };

  const validateStep1 = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (currentStep === 0) {
      if (validateStep0()) {
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleArrowRight = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isAtEnd =
      selectionStart === input.value.length &&
      selectionEnd === input.value.length;
    const isEmpty = input.value.length === 0;

    if ((isAtEnd || isEmpty) && currentStep < 3) {
      e.preventDefault();
      handleContinue();
    }
  };

  const handleArrowLeft = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isAtStart = selectionStart === 0 && selectionEnd === 0;

    if (isAtStart && currentStep > 0) {
      e.preventDefault();
      handleBack();
    }
  };

  const handleTab = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isAtStart = selectionStart === 0 && selectionEnd === 0;
    const isAtEnd =
      selectionStart === input.value.length &&
      selectionEnd === input.value.length;
    const isEmpty = input.value.length === 0;

    if (!e.shiftKey && (isAtEnd || isEmpty) && currentStep < 3) {
      e.preventDefault();
      handleContinue();
    } else if (e.shiftKey && isAtStart && currentStep > 0) {
      e.preventDefault();
      handleBack();
    }
  };

  const handleEscape = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (currentStep > 0) {
      handleBack();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isAtStart = selectionStart === 0 && selectionEnd === 0;
    const isEmpty = input.value.length === 0;

    if (isEmpty && isAtStart && currentStep > 0) {
      e.preventDefault();
      handleBack();
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    e.preventDefault();
    if (currentStep === 3) {
      const form = input.closest("form");
      if (form) {
        form.requestSubmit();
      }
    } else {
      handleContinue();
    }
  };

  const handleKeyboardNavigation = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "ArrowRight") {
      handleArrowRight(e);
    } else if (e.key === "ArrowLeft") {
      handleArrowLeft(e);
    } else if (e.key === "Tab") {
      handleTab(e);
    } else if (e.key === "Escape") {
      handleEscape(e);
    } else if (e.key === "Backspace") {
      handleBackspace(e);
    } else if (e.key === "Enter") {
      handleEnter(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 3) {
      handleContinue();
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signIn.social({ provider: "google" });
      if (error) {
        toast.error(
          error.message || "Failed to sign in with Google. Please try again."
        );
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again."
      );
      setGoogleLoading(false);
    }
  };

  const renderNameField = () => (
    <Label className="flex flex-col items-start gap-2 p-1" htmlFor="name">
      <span className="text-muted-foreground text-sm">
        What&apos;s your name?
      </span>
      <Input
        autoComplete="name"
        autoFocus
        disabled={loading || googleLoading}
        id="name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyboardNavigation}
        placeholder="John Doe"
        ref={setInputRef}
        required
        type="text"
        value={name}
      />
    </Label>
  );

  const renderEmailField = () => (
    <Label className="flex flex-col items-start gap-2 p-1" htmlFor="email">
      <span className="text-muted-foreground text-sm">Enter your email</span>
      <Input
        autoComplete="email"
        autoFocus
        disabled={loading || googleLoading}
        id="email"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyboardNavigation}
        placeholder="you@example.com"
        ref={setInputRef}
        required
        type="email"
        value={email}
      />
    </Label>
  );

  const renderPasswordField = () => (
    <Label className="flex flex-col items-start gap-2 p-1" htmlFor="password">
      <span className="text-muted-foreground text-sm">Enter your password</span>
      <InputGroup>
        <InputGroupInput
          autoComplete="new-password"
          autoFocus
          disabled={loading}
          id="password"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyboardNavigation}
          placeholder="Password"
          ref={setInputRef}
          required
          type={showPassword ? "text" : "password"}
          value={password}
        />
        <InputGroupButton
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="h-9.5 w-9.5 rounded-sm"
          onClick={() => setShowPassword(!showPassword)}
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
    </Label>
  );

  const renderConfirmPasswordField = () => (
    <Label
      className="flex flex-col items-start gap-2 p-1"
      htmlFor="confirm-password"
    >
      <span className="text-muted-foreground text-sm">
        Confirm your password
      </span>
      <InputGroup>
        <InputGroupInput
          autoComplete="new-password"
          autoFocus
          disabled={loading}
          id="confirm-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={handleKeyboardNavigation}
          placeholder="Confirm password"
          ref={setInputRef}
          required
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
        />
        <InputGroupButton
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          className="h-9.5 w-9.5 rounded-sm"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          type="button"
          variant="ghost"
        >
          {showConfirmPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </InputGroupButton>
      </InputGroup>
    </Label>
  );

  const renderCurrentField = () => {
    if (currentStep === 0) {
      return renderNameField();
    }
    if (currentStep === 1) {
      return renderEmailField();
    }
    if (currentStep === 2) {
      return renderPasswordField();
    }
    if (currentStep === 3) {
      return renderConfirmPasswordField();
    }
    return null;
  };

  return (
    <div className="flex w-full max-w-xs flex-col gap-8 bg-transparent">
      <div>
        <h1 className="text-center font-medium text-xl">Sign up to Staxk</h1>
      </div>

      <div className="flex flex-col gap-2">
        {showGoogleFirst && (
          <GoogleSignupButton
            googleLoading={googleLoading}
            loading={loading}
            onClick={handleGoogleSignIn}
            variant="default"
          />
        )}

        {methodDisplayName && (
          <p className="text-center text-muted-foreground text-sm">
            You last used {methodDisplayName} to login
          </p>
        )}

        <form
          aria-busy={loading}
          className="flex flex-col gap-2"
          onSubmit={handleSubmit}
        >
          {renderCurrentField()}

          <div className="relative flex w-full gap-2 p-1">
            {currentStep > 0 && (
              <Button
                aria-label="Go back to previous step"
                className="flex-1"
                disabled={loading || googleLoading}
                onClick={handleBack}
                type="button"
                variant="outline"
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={
                loading ||
                googleLoading ||
                (currentStep === 0 && !name) ||
                (currentStep === 1 && !email) ||
                (currentStep === 2 && !password) ||
                (currentStep === 3 && !confirmPassword)
              }
              type="submit"
            >
              {getButtonText(loading, currentStep)}
            </Button>
          </div>
        </form>

        {!showGoogleFirst && (
          <GoogleSignupButton
            googleLoading={googleLoading}
            loading={loading}
            onClick={handleGoogleSignIn}
            variant="outline"
          />
        )}

        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
