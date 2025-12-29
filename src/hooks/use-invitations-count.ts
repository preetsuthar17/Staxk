"use client";

import { useEffect, useState } from "react";

export function useInvitationsCount() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/invitations");
        const data = await response.json();

        if (response.ok) {
          const invitations = data.invitations || [];
          setCount(invitations.length);
        } else {
          setCount(0);
        }
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    const interval = setInterval(fetchCount, 30_000);

    const handleRefresh = () => {
      fetchCount();
    };
    window.addEventListener("invitations-updated", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("invitations-updated", handleRefresh);
    };
  }, []);

  return { count: count ?? 0, loading };
}
