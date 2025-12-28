"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { validateUsernameFormat } from "@/lib/username";

const CACHE_DURATION = 5 * 60 * 1000;

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
          <p className="text-destructive text-xs" role="alert">
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
        const response = await fetch("/api/user/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedUsername }),
        });

        const data = await response.json();

        if (!response.ok) {
          setAvailability({
            checking: false,
            available: false,
            error: data.error || "Error checking username",
          });
          return;
        }

        usernameCacheRef.current.set(normalizedUsername, {
          available: data.available,
          timestamp: now,
        });

        setAvailability({
          checking: false,
          available: data.available,
          error: data.available ? null : "Username is already taken",
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
