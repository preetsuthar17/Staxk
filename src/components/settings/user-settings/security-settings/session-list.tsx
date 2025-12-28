"use client";

import { LogOut, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Session {
  id: string;
  token: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

interface DeviceInfo {
  icon: typeof Monitor;
  deviceType: string;
  browser: string;
  os: string;
  location?: string;
}

function getDeviceTypeAndIcon(ua: string): {
  deviceType: string;
  icon: typeof Monitor;
} {
  if (ua.includes("mobile") && !ua.includes("tablet")) {
    return { deviceType: "Mobile", icon: Smartphone };
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return { deviceType: "Tablet", icon: Smartphone };
  }
  return { deviceType: "Desktop", icon: Monitor };
}

function getBrowser(ua: string): string {
  if (ua.includes("edg/")) {
    return "Microsoft Edge";
  }
  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return "Chrome";
  }
  if (ua.includes("firefox/")) {
    return "Firefox";
  }
  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return "Safari";
  }
  if (ua.includes("opera/") || ua.includes("opr/")) {
    return "Opera";
  }
  if (ua.includes("brave/")) {
    return "Brave";
  }
  return "Unknown";
}

function getOS(ua: string): string {
  if (ua.includes("windows")) {
    return "Windows";
  }
  if (ua.includes("mac os x") || ua.includes("macintosh")) {
    return "macOS";
  }
  if (ua.includes("linux")) {
    return "Linux";
  }
  if (ua.includes("android")) {
    return "Android";
  }
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return "iOS";
  }
  return "Unknown";
}

function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      icon: Monitor,
      deviceType: "Unknown",
      browser: "Unknown",
      os: "Unknown",
    };
  }

  const ua = userAgent.toLowerCase();
  const { deviceType, icon } = getDeviceTypeAndIcon(ua);
  const browser = getBrowser(ua);
  const os = getOS(ua);

  return { icon, deviceType, browser, os };
}

function getDeviceInfo(userAgent: string | null): DeviceInfo {
  return parseUserAgent(userAgent);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Redesigned skeleton component to closely resemble the actual session item
function SessionItemSkeleton({ isCurrent = false }: { isCurrent?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border border-border ${
        isCurrent ? "bg-muted/30" : ""
      } p-3 px-4`}
    >
      <div className="flex flex-1 items-start gap-4">
        {/* Icon skeleton */}
        <div className="mt-0.5 size-5 animate-pulse rounded bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            {isCurrent && (
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      {/* Skeleton for the right-side button (Log out / Revoke session) */}
      <div>
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function SessionList() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/user/sessions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sessions");
      }

      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch sessions"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (token: string) => {
    setRevokingToken(token);
    try {
      const response = await fetch("/api/user/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke session");
      }

      toast.success("Session revoked successfully");
      await fetchSessions();
      router.refresh();
    } catch (error) {
      console.error("Error revoking session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke session"
      );
    } finally {
      setRevokingToken(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full items-center justify-between">
          <Label className="font-medium text-base">Active sessions</Label>
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="flex w-full flex-col gap-4">
          {/* Current session skeleton */}
          <SessionItemSkeleton isCurrent />

          <Separator className="my-2" />

          {/* Other sessions skeleton */}
          {[1, 2, 3].map((i) => (
            <SessionItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <Label className="font-medium text-base">Active sessions</Label>
      </div>

      <div className="flex w-full flex-col gap-4">
        {currentSession &&
          (() => {
            const deviceInfo = getDeviceInfo(currentSession.userAgent);
            const Icon = deviceInfo.icon;
            return (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3 px-4">
                  <div className="flex flex-1 items-start gap-4">
                    <Icon className="mt-0.5 size-5 text-muted-foreground" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">
                          {deviceInfo.deviceType}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          (Current session)
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
                        <span>
                          {deviceInfo.browser} • {deviceInfo.os}
                        </span>
                        <span className="flex items-center gap-2">
                          <span>
                            {currentSession.ipAddress || "Unknown IP"}
                          </span>
                          <span>•</span>
                          <span>
                            Last active:{" "}
                            {formatDate(
                              currentSession.updatedAt ||
                                currentSession.createdAt
                            )}
                          </span>
                        </span>
                        <span className="text-muted-foreground/80">
                          Created: {formatFullDate(currentSession.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <div {...props}>
                          <Link href="/logout">
                            <Button
                              aria-label="Log out"
                              className="h-8 w-8 cursor-pointer"
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              <LogOut className="size-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    />
                    <TooltipContent align="center" side="top" sideOffset={6}>
                      Log out
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })()}

        {otherSessions.length > 0 && currentSession && (
          <Separator className="my-2" />
        )}

        {otherSessions.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            {otherSessions.map((session) => {
              const deviceInfo = getDeviceInfo(session.userAgent);
              const Icon = deviceInfo.icon;
              return (
                <div
                  className="flex items-center justify-between rounded-md border border-border p-3 px-4"
                  key={session.id}
                >
                  <div className="flex flex-1 items-start gap-4">
                    <Icon className="mt-0.5 size-5 text-muted-foreground" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <span className="font-medium text-sm">
                        {deviceInfo.deviceType}
                      </span>
                      <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
                        <span>
                          {deviceInfo.browser} • {deviceInfo.os}
                        </span>
                        <span className="flex items-center gap-2">
                          <span>{session.ipAddress || "Unknown IP"}</span>
                          <span>•</span>
                          <span>
                            Last active:{" "}
                            {formatDate(session.updatedAt || session.createdAt)}
                          </span>
                        </span>
                        <span className="text-muted-foreground/80">
                          Created: {formatFullDate(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <div {...props}>
                          <Button
                            aria-label="Revoke session"
                            className="h-8 w-8"
                            disabled={revokingToken === session.token}
                            onClick={() => handleRevokeSession(session.token)}
                            size="icon"
                            type="button"
                            variant="destructive"
                          >
                            {revokingToken === session.token ? (
                              <Spinner className="size-3" />
                            ) : (
                              <LogOut className="size-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    />
                    <TooltipContent align="center" side="top" sideOffset={6}>
                      Revoke session
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No active sessions found.
          </p>
        )}
      </div>
    </div>
  );
}
