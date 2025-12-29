"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type OnboardingStep = "welcome" | "name" | "slug" | "description" | "invite";

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/;

function StepContainer({
  children,
  isVisible,
}: {
  children: React.ReactNode;
  isVisible: boolean;
}) {
  return (
    <div
      className={`absolute flex w-full max-w-sm flex-col items-center gap-6 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function WelcomeStep({
  userName,
  isVisible,
}: {
  userName: string;
  isVisible: boolean;
}) {
  return (
    <StepContainer isVisible={isVisible}>
      <Image alt="Staxk Logo" height={48} src="/logo.svg" width={48} />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center font-medium text-xl">
          Welcome to Staxk, {userName}
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Let&apos;s get you onboarded
        </p>
      </div>
    </StepContainer>
  );
}

function NameStep({
  value,
  onChange,
  onNext,
  isLoading,
  isVisible,
}: {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  isLoading: boolean;
  isVisible: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length > 0) {
      onNext();
    }
  };

  return (
    <StepContainer isVisible={isVisible}>
      <Image alt="Staxk Logo" height={48} src="/logo.svg" width={48} />
      <h1 className="text-center font-medium text-xl">Name your workspace</h1>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label className="sr-only" htmlFor="workspace-name">
            Workspace Name
          </Label>
          <Input
            disabled={isLoading}
            id="workspace-name"
            maxLength={50}
            onChange={(e) => onChange(e.target.value)}
            placeholder="My Workspace"
            ref={inputRef}
            value={value}
          />
        </div>
        <Button disabled={isLoading || value.trim().length === 0} type="submit">
          {isLoading ? <Spinner className="size-4" /> : "Next"}
        </Button>
      </form>
    </StepContainer>
  );
}

function SlugStep({
  value,
  onChange,
  onNext,
  onPrev,
  isLoading,
  isChecking,
  slugError,
  slugAvailable,
  isVisible,
}: {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  isChecking: boolean;
  slugError: string | null;
  slugAvailable: boolean;
  isVisible: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slugAvailable && !slugError) {
      onNext();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onChange(newValue);
  };

  return (
    <StepContainer isVisible={isVisible}>
      <Image alt="Staxk Logo" height={48} src="/logo.svg" width={48} />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center font-medium text-xl">
          Choose your workspace URL
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          This will be your workspace&apos;s unique address
        </p>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label className="sr-only" htmlFor="workspace-slug">
            Workspace URL
          </Label>
          <div className="flex items-center gap-0">
            <span className="flex h-10 items-center rounded-l-md border border-input border-r-0 bg-muted px-3 text-muted-foreground text-sm">
              staxk.app/
            </span>
            <Input
              className="rounded-l-none"
              disabled={isLoading}
              id="workspace-slug"
              maxLength={30}
              onChange={handleChange}
              placeholder="my-workspace"
              ref={inputRef}
              value={value}
            />
          </div>
          {isChecking && (
            <p className="flex items-center gap-2 text-muted-foreground text-xs">
              <Spinner className="size-3" />
              Checking availability...
            </p>
          )}
          {slugError && <p className="text-destructive text-xs">{slugError}</p>}
          {slugAvailable && !slugError && value.length >= 3 && (
            <p className="text-green-600 text-xs">This URL is available!</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isLoading}
            onClick={onPrev}
            type="button"
            variant="outline"
          >
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={
              isLoading || !slugAvailable || !!slugError || value.length < 3
            }
            type="submit"
          >
            {isLoading ? <Spinner className="size-4" /> : "Next"}
          </Button>
        </div>
      </form>
    </StepContainer>
  );
}

function DescriptionStep({
  value,
  onChange,
  onNext,
  onPrev,
  isLoading,
  isVisible,
}: {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  isVisible: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <StepContainer isVisible={isVisible}>
      <Image alt="Staxk Logo" height={48} src="/logo.svg" width={48} />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center font-medium text-xl">
          Describe your workspace
        </h1>
        <p className="text-center text-muted-foreground text-sm">(optional)</p>
      </div>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label className="sr-only" htmlFor="workspace-description">
            Description
          </Label>
          <Textarea
            disabled={isLoading}
            id="workspace-description"
            maxLength={500}
            onChange={(e) => onChange(e.target.value)}
            placeholder="What's this workspace for?"
            ref={textareaRef}
            rows={4}
            value={value}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isLoading}
            onClick={onPrev}
            type="button"
            variant="outline"
          >
            Back
          </Button>
          <Button className="flex-1" disabled={isLoading} type="submit">
            {isLoading ? <Spinner className="size-4" /> : "Next"}
          </Button>
        </div>
      </form>
    </StepContainer>
  );
}

function InviteStep({
  onPrev,
  onFinish,
  isLoading,
  isVisible,
}: {
  onPrev: () => void;
  onFinish: () => void;
  isLoading: boolean;
  isVisible: boolean;
}) {
  return (
    <StepContainer isVisible={isVisible}>
      <Image alt="Staxk Logo" height={48} src="/logo.svg" width={48} />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center font-medium text-xl">
          Invite your team members
        </h1>
        <p className="text-center text-muted-foreground text-sm">(optional)</p>
      </div>
      <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed p-6">
        <p className="text-center text-muted-foreground text-sm">
          You can invite team members after setting up your workspace
        </p>
      </div>
      <div className="flex w-full gap-2">
        <Button
          className="flex-1"
          disabled={isLoading}
          onClick={onPrev}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button className="flex-1" disabled={isLoading} onClick={onFinish}>
          {isLoading ? <Spinner className="size-4" /> : "Create Workspace"}
        </Button>
      </div>
    </StepContainer>
  );
}

export function OnboardingClient({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState(false);

  useEffect(() => {
    if (step === "welcome") {
      const timer = setTimeout(() => {
        setStep("name");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(false);
      setSlugError(null);
      return;
    }

    if (!SLUG_REGEX.test(slug)) {
      setSlugAvailable(false);
      setSlugError(
        "Must start with a letter and contain only lowercase letters, numbers, and hyphens"
      );
      return;
    }

    if (slug.endsWith("-")) {
      setSlugAvailable(false);
      setSlugError("Cannot end with a hyphen");
      return;
    }

    if (slug.includes("--")) {
      setSlugAvailable(false);
      setSlugError("Cannot contain consecutive hyphens");
      return;
    }

    setIsCheckingSlug(true);
    try {
      const response = await fetch(
        `/api/workspace/check-slug?slug=${encodeURIComponent(slug)}`
      );
      const data = await response.json();
      setSlugAvailable(data.available);
      setSlugError(data.error || null);
    } catch {
      setSlugError("Failed to check availability");
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (workspaceSlug) {
        checkSlugAvailability(workspaceSlug);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [workspaceSlug, checkSlugAvailability]);

  const handleSlugChange = (value: string) => {
    setWorkspaceSlug(value);
    setSlugAvailable(false);
    setSlugError(null);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceSlug,
          description: workspaceDescription || null,
          isOnboarding: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      router.push(`/${data.slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <WelcomeStep isVisible={step === "welcome"} userName={userName} />
      <NameStep
        isLoading={isLoading}
        isVisible={step === "name"}
        onChange={setWorkspaceName}
        onNext={() => setStep("slug")}
        value={workspaceName}
      />
      <SlugStep
        isChecking={isCheckingSlug}
        isLoading={isLoading}
        isVisible={step === "slug"}
        onChange={handleSlugChange}
        onNext={() => setStep("description")}
        onPrev={() => setStep("name")}
        slugAvailable={slugAvailable}
        slugError={slugError}
        value={workspaceSlug}
      />
      <DescriptionStep
        isLoading={isLoading}
        isVisible={step === "description"}
        onChange={setWorkspaceDescription}
        onNext={() => setStep("invite")}
        onPrev={() => setStep("slug")}
        value={workspaceDescription}
      />
      <InviteStep
        isLoading={isLoading}
        isVisible={step === "invite"}
        onFinish={handleFinish}
        onPrev={() => setStep("description")}
      />
    </div>
  );
}
