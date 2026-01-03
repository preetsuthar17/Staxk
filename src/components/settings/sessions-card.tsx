"use client";

import { IconTrash } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemDescription,
  ItemGroup,
  ItemHeader,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionsCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/sessions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to load sessions");
        return;
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error("An error occurred while loading sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions().catch(() => {
      // Error handling is done in fetchSessions
    });
  }, [fetchSessions]);

  const formatLastActive = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown";
    }
  }, []);

  const formatDeviceName = useCallback((userAgent: string | null | undefined): string => {
    if (!userAgent || typeof userAgent !== "string") {
      return "Unknown Device";
    }

    const ua = userAgent.toLowerCase();

    // Detect OS
    let os = "Unknown";
    let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";

    if (ua.includes("windows")) {
      if (ua.includes("phone")) {
        os = "Windows Phone";
        deviceType = "Mobile";
      } else {
        os = "Windows";
        deviceType = "Desktop";
      }
    } else if (ua.includes("mac os x") || ua.includes("macintosh")) {
      if (ua.includes("iphone") || ua.includes("ipad")) {
        // Handled separately below
      } else {
        os = "macOS";
        deviceType = "Desktop";
      }
    } else if (ua.includes("iphone")) {
      os = "iOS";
      deviceType = "Mobile";
    } else if (ua.includes("ipad")) {
      os = "iPadOS";
      deviceType = "Tablet";
    } else if (ua.includes("android")) {
      if (ua.includes("mobile")) {
        os = "Android";
        deviceType = "Mobile";
      } else {
        os = "Android";
        deviceType = "Tablet";
      }
    } else if (ua.includes("linux")) {
      os = "Linux";
      deviceType = "Desktop";
    } else if (ua.includes("x11")) {
      os = "Unix";
      deviceType = "Desktop";
    }

    // Detect Browser
    let browser = "Unknown";

    if (ua.includes("edg/")) {
      browser = "Edge";
    } else if (ua.includes("chrome/") && !ua.includes("edg/")) {
      browser = "Chrome";
    } else if (ua.includes("firefox/")) {
      browser = "Firefox";
    } else if (ua.includes("safari/") && !ua.includes("chrome/")) {
      browser = "Safari";
    } else if (ua.includes("opera/") || ua.includes("opr/")) {
      browser = "Opera";
    } else if (ua.includes("msie") || ua.includes("trident/")) {
      browser = "Internet Explorer";
    } else if (ua.includes("brave/")) {
      browser = "Brave";
    }

    // Format device name
    let deviceName = `${browser} on ${os}`;

    // Special handling for mobile devices
    if (deviceType === "Mobile" || deviceType === "Tablet") {
      deviceName = `${browser} on ${deviceType === "Mobile" ? "Mobile" : "Tablet"} (${os})`;
    }

    return deviceName;
  }, []);

  const handleRevokeClick = useCallback((session: Session) => {
    setSessionToRevoke(session);
    setShowRevokeDialog(true);
  }, []);

  const handleRevokeConfirm = useCallback(async () => {
    if (!sessionToRevoke) {
      return;
    }

    setRevokingToken(sessionToRevoke.token);
    setShowRevokeDialog(false);

    try {
      const response = await fetch(
        `/api/user/sessions?token=${encodeURIComponent(sessionToRevoke.token)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to revoke session");
        return;
      }

      toast.success("Session revoked successfully");
      await fetchSessions();
    } catch (error) {
      toast.error("An error occurred while revoking session");
    } finally {
      setRevokingToken(null);
      setSessionToRevoke(null);
    }
  }, [sessionToRevoke, fetchSessions]);

  const handleRevokeAllClick = useCallback(() => {
    setShowRevokeAllDialog(true);
  }, []);

  const handleRevokeAllConfirm = useCallback(async () => {
    setIsRevokingAll(true);
    setShowRevokeAllDialog(false);

    try {
      const response = await fetch("/api/user/sessions?all=true", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to revoke all sessions");
        return;
      }

      toast.success("All sessions revoked successfully");
      await fetchSessions();
    } catch (error) {
      toast.error("An error occurred while revoking sessions");
    } finally {
      setIsRevokingAll(false);
    }
  }, [fetchSessions]);

  const isLoadingState = useMemo(() => isLoading, [isLoading]);

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across different devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isLoadingState ? (
              <ItemGroup>
                {[1, 2, 3].map((i) => (
                  <Item key={i} variant="outline" className="flex items-center justify-between gap-2">
                    <ItemHeader className="w-fit basis-0">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </ItemHeader>
                    <ItemActions>
                      <Skeleton className="size-9" />
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <>
                {sessions.length > 0 ? (
                  <>
                    <ItemGroup>
                      {sessions.map((sessionItem) => (
                        <Item
                          className="flex-nowrap"
                          key={sessionItem.id}
                          variant="outline"
                        >
                          <ItemHeader>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatDeviceName(sessionItem.userAgent)}
                                </span>
                                {sessionItem.isCurrent && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs font-medium">
                                    Current
                                  </span>
                                )}
                              </div>
                              <ItemDescription>
                                Last active {formatLastActive(sessionItem.updatedAt)}
                                {sessionItem.ipAddress &&
                                  ` • ${sessionItem.ipAddress}`}
                              </ItemDescription>
                            </div>
                          </ItemHeader>
                          <ItemActions>
                            {!sessionItem.isCurrent && (
                              <Button
                                aria-label="Revoke session"
                                disabled={revokingToken === sessionItem.token}
                                loading={revokingToken === sessionItem.token}
                                onClick={() => handleRevokeClick(sessionItem)}
                                size="icon"
                                variant="ghost"
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            )}
                          </ItemActions>
                        </Item>
                      ))}
                    </ItemGroup>
                    <div className="flex justify-end">
                      <Button
                        disabled={isRevokingAll}
                        loading={isRevokingAll}
                        onClick={handleRevokeAllClick}
                        type="button"
                        variant="destructive"
                      >
                        Revoke All Sessions
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No active sessions found.
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setShowRevokeDialog} open={showRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? You will be signed
              out from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              disabled={!!revokingToken}
              onClick={() => {
                setShowRevokeDialog(false);
                setSessionToRevoke(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <AlertDialogAction
              disabled={!!revokingToken}
              onClick={handleRevokeConfirm}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={setShowRevokeAllDialog}
        open={showRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke all sessions? You will be signed
              out from all devices except this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              disabled={isRevokingAll}
              onClick={() => {
                setShowRevokeAllDialog(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <AlertDialogAction
              disabled={isRevokingAll}
              onClick={handleRevokeAllConfirm}
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

