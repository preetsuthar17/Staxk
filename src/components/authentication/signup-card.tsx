"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
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

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height={20}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
      }}
      viewBox="0 0 268.152 273.883"
      width={20}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="google__a">
          <stop offset="0" stopColor="#0fbc5c" />
          <stop offset="1" stopColor="#0cba65" />
        </linearGradient>
        <linearGradient id="google__g">
          <stop offset=".231" stopColor="#0fbc5f" />
          <stop offset=".312" stopColor="#0fbc5f" />
          <stop offset=".366" stopColor="#0fbc5e" />
          <stop offset=".458" stopColor="#0fbc5d" />
          <stop offset=".54" stopColor="#12bc58" />
          <stop offset=".699" stopColor="#28bf3c" />
          <stop offset=".771" stopColor="#38c02b" />
          <stop offset=".861" stopColor="#52c218" />
          <stop offset=".915" stopColor="#67c30f" />
          <stop offset="1" stopColor="#86c504" />
        </linearGradient>
        <linearGradient id="google__h">
          <stop offset=".142" stopColor="#1abd4d" />
          <stop offset=".248" stopColor="#6ec30d" />
          <stop offset=".312" stopColor="#8ac502" />
          <stop offset=".366" stopColor="#a2c600" />
          <stop offset=".446" stopColor="#c8c903" />
          <stop offset=".54" stopColor="#ebcb03" />
          <stop offset=".616" stopColor="#f7cd07" />
          <stop offset=".699" stopColor="#fdcd04" />
          <stop offset=".771" stopColor="#fdce05" />
          <stop offset=".861" stopColor="#ffce0a" />
        </linearGradient>
        <linearGradient id="google__f">
          <stop offset=".316" stopColor="#ff4c3c" />
          <stop offset=".604" stopColor="#ff692c" />
          <stop offset=".727" stopColor="#ff7825" />
          <stop offset=".885" stopColor="#ff8d1b" />
          <stop offset="1" stopColor="#ff9f13" />
        </linearGradient>
        <linearGradient id="google__b">
          <stop offset=".231" stopColor="#ff4541" />
          <stop offset=".312" stopColor="#ff4540" />
          <stop offset=".458" stopColor="#ff4640" />
          <stop offset=".54" stopColor="#ff473f" />
          <stop offset=".699" stopColor="#ff5138" />
          <stop offset=".771" stopColor="#ff5b33" />
          <stop offset=".861" stopColor="#ff6c29" />
          <stop offset="1" stopColor="#ff8c18" />
        </linearGradient>
        <linearGradient id="google__d">
          <stop offset=".408" stopColor="#fb4e5a" />
          <stop offset="1" stopColor="#ff4540" />
        </linearGradient>
        <linearGradient id="google__c">
          <stop offset=".132" stopColor="#0cba65" />
          <stop offset=".21" stopColor="#0bb86d" />
          <stop offset=".297" stopColor="#09b479" />
          <stop offset=".396" stopColor="#08ad93" />
          <stop offset=".477" stopColor="#0aa6a9" />
          <stop offset=".568" stopColor="#0d9cc6" />
          <stop offset=".667" stopColor="#1893dd" />
          <stop offset=".769" stopColor="#258bf1" />
          <stop offset=".859" stopColor="#3086ff" />
        </linearGradient>
        <linearGradient id="google__e">
          <stop offset=".366" stopColor="#ff4e3a" />
          <stop offset=".458" stopColor="#ff8a1b" />
          <stop offset=".54" stopColor="#ffa312" />
          <stop offset=".616" stopColor="#ffb60c" />
          <stop offset=".771" stopColor="#ffcd0a" />
          <stop offset=".861" stopColor="#fecf0a" />
          <stop offset=".915" stopColor="#fecf08" />
          <stop offset="1" stopColor="#fdcd01" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="google__s"
          x1="219.7"
          x2="254.467"
          xlinkHref="#google__a"
          y1="329.535"
          y2="329.535"
        />
        <radialGradient
          cx="109.627"
          cy="135.862"
          fx="109.627"
          fy="135.862"
          gradientTransform="matrix(-1.93688 1.043 1.45573 2.55542 290.525 -400.634)"
          gradientUnits="userSpaceOnUse"
          id="google__m"
          r="71.46"
          xlinkHref="#google__b"
        />
        <radialGradient
          cx="45.259"
          cy="279.274"
          fx="45.259"
          fy="279.274"
          gradientTransform="matrix(-3.5126 -4.45809 -1.69255 1.26062 870.8 191.554)"
          gradientUnits="userSpaceOnUse"
          id="google__n"
          r="71.46"
          xlinkHref="#google__c"
        />
        <radialGradient
          cx="304.017"
          cy="118.009"
          fx="304.017"
          fy="118.009"
          gradientTransform="matrix(2.06435 0 0 2.59204 -297.679 -151.747)"
          gradientUnits="userSpaceOnUse"
          id="google__l"
          r="47.854"
          xlinkHref="#google__d"
        />
        <radialGradient
          cx="181.001"
          cy="177.201"
          fx="181.001"
          fy="177.201"
          gradientTransform="matrix(-.24858 2.08314 2.96249 .33417 -255.146 -331.164)"
          gradientUnits="userSpaceOnUse"
          id="google__o"
          r="71.46"
          xlinkHref="#google__e"
        />
        <radialGradient
          cx="207.673"
          cy="108.097"
          fx="207.673"
          fy="108.097"
          gradientTransform="matrix(-1.2492 1.34326 -3.89684 -3.4257 880.501 194.905)"
          gradientUnits="userSpaceOnUse"
          id="google__p"
          r="41.102"
          xlinkHref="#google__f"
        />
        <radialGradient
          cx="109.627"
          cy="135.862"
          fx="109.627"
          fy="135.862"
          gradientTransform="matrix(-1.93688 -1.043 1.45573 -2.55542 290.525 838.683)"
          gradientUnits="userSpaceOnUse"
          id="google__r"
          r="71.46"
          xlinkHref="#google__g"
        />
        <radialGradient
          cx="154.87"
          cy="145.969"
          fx="154.87"
          fy="145.969"
          gradientTransform="matrix(-.0814 -1.93722 2.92674 -.11625 -215.135 632.86)"
          gradientUnits="userSpaceOnUse"
          id="google__j"
          r="71.46"
          xlinkHref="#google__h"
        />
        <filter
          colorInterpolationFilters="sRGB"
          height="1.116"
          id="google__q"
          width="1.097"
          x="-.048"
          y="-.058"
        >
          <feGaussianBlur stdDeviation="1.701" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          height="1.02"
          id="google__k"
          width="1.033"
          x="-.017"
          y="-.01"
        >
          <feGaussianBlur stdDeviation=".242" />
        </filter>
        <clipPath clipPathUnits="userSpaceOnUse" id="google__i">
          <path d="M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786-4.674 7.773-10.451 13.69-16.373 18.196-17.74 13.498-38.42 16.258-52.783 16.258-36.283 0-67.283-23.286-79.285-54.928-.484-1.149-.805-2.335-1.197-3.507a81.115 81.115 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398 11.285-32.897 42.985-57.467 80.179-57.467 7.481 0 14.685.884 21.517 2.648a77.668 77.668 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32-30.878 0-59.386 9.553-82.748 25.7-18.945 13.093-34.483 30.625-44.97 50.985-9.753 18.879-15.094 39.8-15.094 62.294 0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988 15.997 11.386 44.68 26.551 84.031 26.551 22.63 0 42.687-4.051 60.375-11.644 12.76-5.478 24.065-12.622 34.301-21.804 13.525-12.132 24.117-27.139 31.347-44.404 7.23-17.265 11.097-36.79 11.097-57.957 0-9.858-.998-19.87-2.689-28.968Z" />
        </clipPath>
      </defs>
      <g
        clipPath="url(#google__i)"
        transform="matrix(.95792 0 0 .98525 -90.174 -78.856)"
      >
        <path
          d="M92.076 219.958c.148 22.14 6.501 44.983 16.117 63.424v.127c6.949 13.392 16.445 23.97 27.26 34.452l65.327-23.67c-12.36-6.235-14.246-10.055-23.105-17.026-9.054-9.066-15.802-19.473-20.004-31.677h-.17l.17-.127c-2.765-8.058-3.037-16.613-3.14-25.503Z"
          fill="url(#google__j)"
          filter="url(#google__k)"
        />
        <path
          d="M237.083 79.025c-6.456 22.526-3.988 44.421 0 57.161 7.457.006 14.64.888 21.45 2.647a77.662 77.662 0 0 1 33.424 18.25l41.88-40.726c-24.81-22.59-54.667-37.297-96.754-37.332Z"
          fill="url(#google__l)"
          filter="url(#google__k)"
        />
        <path
          d="M236.943 78.847c-31.67 0-60.91 9.798-84.871 26.359a145.533 145.533 0 0 0-24.332 21.15c-1.904 17.744 14.257 39.551 46.262 39.37 15.528-17.936 38.495-29.542 64.056-29.542l.07.002-1.044-57.335c-.048 0-.093-.004-.14-.004Z"
          fill="url(#google__m)"
          filter="url(#google__k)"
        />
        <path
          d="m341.475 226.379-28.268 19.285c-1.24 7.562-4.028 15.002-8.107 21.786-4.674 7.772-10.45 13.69-16.373 18.196-17.702 13.47-38.328 16.244-52.687 16.255-14.842 25.102-17.444 37.675 1.043 57.934 22.877-.016 43.157-4.117 61.046-11.796 12.931-5.551 24.388-12.792 34.761-22.097 13.706-12.295 24.442-27.503 31.769-45 7.327-17.497 11.245-37.282 11.245-58.734Z"
          fill="url(#google__n)"
          filter="url(#google__k)"
        />
        <path
          d="M234.996 191.21v57.498h136.006c1.196-7.874 5.152-18.064 5.152-26.5 0-9.858-.996-21.899-2.687-30.998Z"
          fill="#3086ff"
          filter="url(#google__k)"
        />
        <path
          d="M128.39 124.327c-8.394 9.119-15.564 19.326-21.249 30.364-9.753 18.879-15.094 41.83-15.094 64.324 0 .317.026.627.029.944 4.32 8.224 59.666 6.649 62.456 0-.004-.31-.039-.613-.039-.924 0-9.226 1.57-16.026 4.43-24.367 3.53-10.289 9.056-19.763 16.123-27.926 1.602-2.031 5.875-6.397 7.121-9.016.475-.997-.862-1.557-.937-1.908-.083-.393-1.876-.077-2.277-.37-1.275-.929-3.8-1.414-5.334-1.845-3.277-.921-8.708-2.953-11.725-5.06-9.536-6.658-24.417-14.612-33.505-24.216Z"
          fill="url(#google__o)"
          filter="url(#google__k)"
        />
        <path
          d="M162.099 155.857c22.112 13.301 28.471-6.714 43.173-12.977l-25.574-52.664a144.74 144.74 0 0 0-26.543 14.504c-12.316 8.512-23.192 18.9-32.176 30.72Z"
          fill="url(#google__p)"
          filter="url(#google__q)"
        />
        <path
          d="M171.099 290.222c-29.683 10.641-34.33 11.023-37.062 29.29a144.806 144.806 0 0 0 16.792 13.984c15.996 11.386 46.766 26.551 86.118 26.551.046 0 .09-.004.137-.004v-59.157l-.094.002c-14.736 0-26.512-3.843-38.585-10.527-2.977-1.648-8.378 2.777-11.123.799-3.786-2.729-12.9 2.35-16.183-.938Z"
          fill="url(#google__r)"
          filter="url(#google__k)"
        />
        <path
          d="M219.7 299.023v59.996c5.506.64 11.236 1.028 17.247 1.028 6.026 0 11.855-.307 17.52-.872v-59.748a105.119 105.119 0 0 1-17.477 1.461c-5.932 0-11.7-.686-17.29-1.865Z"
          fill="url(#google__s)"
          filter="url(#google__k)"
          opacity=".5"
        />
      </g>
    </svg>
  );
}

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
        {googleLoading ? (
          <Spinner />
        ) : (
          <span className="flex items-center gap-3">
            <GoogleLogo className="size-4" /> Sign up with Google
          </span>
        )}
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
      <div className="flex flex-col items-center justify-center gap-4">
        <Image
          alt="Staxk Logo"
          className="grayscale contrast-200"
          height={38}
          src="/logo.svg"
          width={38}
        />
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
      </div>
      <div>
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
