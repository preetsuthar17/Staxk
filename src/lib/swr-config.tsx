"use client";

import { SWRConfig } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch");
    throw error;
  }
  return res.json();
};

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
