"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const SLUG_DEBOUNCE_MS = 300;

const onboardingSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters`)
    .regex(
      SLUG_REGEX,
      "Slug can only contain letters, numbers, hyphens, and underscores"
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const nameSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
});

const slugSchema = z.object({
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters`)
    .regex(
      SLUG_REGEX,
      "Slug can only contain letters, numbers, hyphens, and underscores"
    ),
});

const descriptionSchema = z.object({
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

export function OnboardingForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const slugManuallyEditedRef = useRef<boolean>(false);

  const user = session?.user;

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
    mode: "onChange",
  });

  const slug = form.watch("slug");

  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => {
        setCurrentStep(2);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 3) {
      return;
    }

    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }

    const trimmedSlug = slug?.trim().toLowerCase();
    if (!trimmedSlug || trimmedSlug.length < MIN_SLUG_LENGTH) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    if (!SLUG_REGEX.test(trimmedSlug) || trimmedSlug.length > MAX_SLUG_LENGTH) {
      setSlugAvailable(false);
      setCheckingSlug(false);
      return;
    }

    setCheckingSlug(true);
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/workspace/slug/check?slug=${encodeURIComponent(trimmedSlug)}`
        );

        if (!response.ok) {
          setSlugAvailable(null);
          return;
        }

        const data = await response.json();
        setSlugAvailable(data?.available ?? false);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, SLUG_DEBOUNCE_MS);

    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, [slug, currentStep]);

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      let schema:
        | typeof nameSchema
        | typeof slugSchema
        | typeof descriptionSchema;
      if (step === 2) {
        schema = nameSchema;
      } else if (step === 3) {
        schema = slugSchema;
      } else if (step === 4) {
        schema = descriptionSchema;
      } else {
        return true;
      }

      const result = await form.trigger(
        Object.keys(schema.shape) as Array<keyof OnboardingFormData>
      );
      return result;
    },
    [form]
  );

  const validateSlugAvailability = useCallback((): boolean => {
    if (slugAvailable === false) {
      toast.error("Workspace slug is not available");
      return false;
    }
    if (slugAvailable === null && slug?.trim()) {
      toast.error("Please wait for slug availability check");
      return false;
    }
    return true;
  }, [slugAvailable, slug]);

  const handleNext = useCallback(async () => {
    if (currentStep === 5) {
      return;
    }

    if (currentStep === 3) {
      const isValid = await validateStep(3);
      if (!isValid) {
        return;
      }
      if (!validateSlugAvailability()) {
        return;
      }
    } else if (currentStep !== 1 && currentStep !== 5) {
      const isValid = await validateStep(currentStep);
      if (!isValid) {
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  }, [currentStep, validateStep, validateSlugAvailability]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    if (currentStep === 3 && !validateSlugAvailability()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = form.getValues();
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim().toLowerCase(),
          description: formData.description?.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to create workspace");
        setIsLoading(false);
        return;
      }

      setCurrentStep(5);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
      setIsLoading(false);
    }
  }, [currentStep, form, validateSlugAvailability]);

  useEffect(() => {
    if (currentStep === 5) {
      const timer = setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, router]);

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_SLUG_LENGTH);
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (currentStep === 2 && !slugManuallyEditedRef.current) {
      const autoSlug = generateSlugFromName(value);
      if (autoSlug.length >= MIN_SLUG_LENGTH) {
        form.setValue("slug", autoSlug);
      } else {
        form.setValue("slug", "");
      }
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", value);
    slugManuallyEditedRef.current = true;
  };

  useEffect(() => {
    const handleEnterKey = (event: KeyboardEvent) => {
      const isTextarea = event.target instanceof HTMLTextAreaElement;
      const hasModifiers = event.metaKey || event.ctrlKey;

      if (isTextarea && event.key === "Enter" && !hasModifiers) {
        return true;
      }

      if (
        hasModifiers &&
        event.key === "Enter" &&
        currentStep === 4 &&
        !isLoading
      ) {
        event.preventDefault();
        handleSubmit();
        return true;
      }

      if (
        event.key === "Enter" &&
        !hasModifiers &&
        !isTextarea &&
        (currentStep === 2 || currentStep === 3)
      ) {
        event.preventDefault();
        handleNext();
        return true;
      }

      return false;
    };

    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && currentStep > 1 && !isLoading) {
        event.preventDefault();
        handlePrev();
        return true;
      }

      if (event.key === "ArrowRight" && currentStep < 5 && !isLoading) {
        event.preventDefault();
        if (currentStep === 4) {
          handleSubmit();
        } else {
          handleNext();
        }
        return true;
      }

      return false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (handleEnterKey(event)) {
        return;
      }
      handleArrowKeys(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLoading, handleNext, handlePrev, handleSubmit]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <Image alt="Staxk" height={42} src="/logo.svg" width={42} />

        <div className="relative flex min-h-[200px] w-full flex-col gap-6">
          <div
            className={`absolute inset-0 flex flex-col gap-2 transition-opacity duration-300 ${
              currentStep === 1
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <h1 className="font-medium text-xl">
              Welcome to Staxk
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Let's get you set up with your workspace.
            </p>
          </div>

          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${
              currentStep === 2
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                What would you like to name your workspace?
              </h1>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <Input
                id="name"
                {...form.register("name")}
                autoFocus={currentStep === 2}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Workspace"
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${
              currentStep === 3
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                Choose a unique URL-friendly identifier for your workspace.
              </h1>
            </div>
            <div className="flex flex-col gap-2 text-left">
              <div className="relative">
                <Input
                  id="slug"
                  {...form.register("slug")}
                  autoFocus={currentStep === 3}
                  className="pr-20"
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-workspace"
                />
                {checkingSlug && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <Spinner className="size-4" />
                  </div>
                )}
                {!checkingSlug && slugAvailable !== null && slug?.trim() && (
                  <div
                    className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs ${
                      slugAvailable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {slugAvailable ? "Available" : "Slug is not available"}
                  </div>
                )}
              </div>
              <FieldError>{form.formState.errors.slug?.message}</FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handleNext}
                type="button"
              >
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div
            className={`absolute inset-0 flex flex-col gap-6 transition-opacity duration-300 ${
              currentStep === 4
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-col gap-2">
              <h1 className="font-medium text-xl">
                Tell us a bit about your workspace.
              </h1>
              <p className="text-muted-foreground text-sm">(optional)</p>
            </div>
            <div className="flex flex-col gap-2">
              <Textarea
                id="description"
                {...form.register("description")}
                autoFocus={currentStep === 4}
                placeholder="A brief description of what this workspace is for..."
                rows={4}
              />
              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                className="flex-1"
                disabled={isLoading}
                onClick={handlePrev}
                type="button"
                variant="outline"
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading}
                loading={isLoading}
                onClick={handleSubmit}
                type="button"
              >
                Create Workspace
              </Button>
            </div>
          </div>

          <div
            className={`absolute inset-0 flex flex-col gap-2 transition-opacity duration-300 ${
              currentStep === 5
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <h1 className="font-medium text-xl">You're all set up!</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
