"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const CACHE_DURATION = 5 * 60 * 1000;

const USERNAME_STARTS_WITH_LETTER_REGEX = /^[a-z]/i;
const USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX = /^[a-z0-9_]+$/;

/**
 * Validates username format
 * Rules:
 * - 3-30 characters
 * - Only lowercase letters, numbers, and underscores
 * - Must start with a letter
 * - Cannot end with underscore
 */
function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less" };
  }

  if (!USERNAME_STARTS_WITH_LETTER_REGEX.test(username)) {
    return { valid: false, error: "Username must start with a letter" };
  }

  if (!USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX.test(username)) {
    return {
      valid: false,
      error:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  if (username.endsWith("_")) {
    return { valid: false, error: "Username cannot end with an underscore" };
  }

  if (username.includes("__")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive underscores",
    };
  }

  return { valid: true };
}

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isChecking?: boolean;
  isValid?: boolean;
  disabled?: boolean;
  "aria-describedby"?: string;
}

export function UsernameInput({
  value,
  onChange,
  error,
  isChecking,
  isValid,
  disabled,
  "aria-describedby": ariaDescribedBy,
}: UsernameInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    onChange(val);
  };

  return (
    <div className="flex-1">
      <div className="relative">
        <Input
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? "true" : "false"}
          className={value ? "pr-10" : ""}
          disabled={disabled}
          id="username"
          onChange={handleChange}
          placeholder="username_123"
          value={value}
        />
        {value && (
          <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            {isChecking && (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin text-muted-foreground"
              />
            )}
            {!isChecking && isValid === true && (
              <CheckCircle2
                aria-label="Username is available"
                className="size-4 text-green-600 dark:text-green-500"
              />
            )}
            {!isChecking && isValid === false && (
              <XCircle
                aria-label="Username is not available"
                className="size-4 text-destructive"
              />
            )}
          </div>
        )}
      </div>
      <output aria-live="polite" className="mt-2 min-h-5" id={ariaDescribedBy}>
        {error && (
          <p className="mt-2 text-destructive text-xs" role="alert">
            {error}
          </p>
        )}
      </output>
    </div>
  );
}

export function useUsernameAvailability(
  username: string,
  currentUsername?: string
) {
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({ checking: false, available: null, error: null });

  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCacheRef = useRef<
    Map<string, { available: boolean; timestamp: number }>
  >(new Map());

  useEffect(() => {
    if (!username || username === currentUsername) {
      setAvailability({ checking: false, available: null, error: null });
      return;
    }

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    const formatValidation = validateUsernameFormat(username);
    if (!formatValidation.valid) {
      setAvailability({
        checking: false,
        available: false,
        error: formatValidation.error || "Invalid format",
      });
      return;
    }

    const normalizedUsername = username.toLowerCase();
    const cached = usernameCacheRef.current.get(normalizedUsername);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setAvailability({
        checking: false,
        available: cached.available,
        error: cached.available ? null : "Username is already taken",
      });
      return;
    }

    setAvailability({ checking: true, available: null, error: null });

    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await authClient.isUsernameAvailable({
          username: normalizedUsername,
        });

        if (error) {
          setAvailability({
            checking: false,
            available: false,
            error: error.message || "Error checking username",
          });
          return;
        }

        const isAvailable = data?.available ?? false;

        usernameCacheRef.current.set(normalizedUsername, {
          available: isAvailable,
          timestamp: now,
        });

        setAvailability({
          checking: false,
          available: isAvailable,
          error: isAvailable ? null : "Username is already taken",
        });
      } catch {
        setAvailability({
          checking: false,
          available: false,
          error: "Failed to check username availability",
        });
      }
    }, 300);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username, currentUsername]);

  return availability;
}
