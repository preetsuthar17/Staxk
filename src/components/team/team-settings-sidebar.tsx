"use client";

import {
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconSearch,
  IconSettings,
  IconSettingsFilled,
  IconUsers,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SearchableItem {
  title: string;
  description?: string;
  url: string;
  category: string;
  type: "category" | "card";
}

const MAC_PLATFORM_REGEX = /Mac|iPhone|iPad|iPod/;

function decodeHtmlEntities(text: string): string {
  if (typeof document === "undefined") {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return decodeHtmlEntities(text);
  }

  const decodedText = decodeHtmlEntities(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = decodedText.split(regex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <mark key={`highlight-${index}-${part}`}>{part}</mark>;
    }
    return <span key={`text-${index}-${part}`}>{part}</span>;
  });
}

interface TeamSettingsSidebarProps {
  workspaceSlug: string;
  teamIdentifier: string;
}

export function TeamSettingsSidebar({
  workspaceSlug,
  teamIdentifier,
}: TeamSettingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [shouldRenderResults, setShouldRenderResults] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(
      MAC_PLATFORM_REGEX.test(navigator.platform) ||
        (navigator as { userAgentData?: { platform?: string } }).userAgentData
          ?.platform === "macOS"
    );
  }, []);

  const baseUrl = useMemo(
    () => `/${workspaceSlug}/teams/${teamIdentifier}/settings`,
    [workspaceSlug, teamIdentifier]
  );

  const SETTINGS_INDEX: SearchableItem[] = useMemo(
    () => [
      {
        title: "General",
        url: baseUrl,
        category: "General",
        type: "category",
      },
      {
        title: "Team Name",
        description: "Change the team name and identifier.",
        url: baseUrl,
        category: "General",
        type: "card",
      },
      {
        title: "Members",
        url: `${baseUrl}/members`,
        category: "Members",
        type: "category",
      },
      {
        title: "Manage Team Members",
        description: "Add, remove, and manage team members.",
        url: `${baseUrl}/members`,
        category: "Members",
        type: "card",
      },
      {
        title: "Danger Zone",
        url: `${baseUrl}/danger-zone`,
        category: "Danger Zone",
        type: "category",
      },
      {
        title: "Delete Team",
        description: "Permanently delete this team.",
        url: `${baseUrl}/danger-zone`,
        category: "Danger Zone",
        type: "card",
      },
    ],
    [baseUrl]
  );

  const menuItems = useMemo(
    () => [
      {
        title: "General",
        url: baseUrl,
        icon: IconSettings,
        iconFilled: IconSettingsFilled,
      },
      {
        title: "Members",
        url: `${baseUrl}/members`,
        icon: IconUsers,
        iconFilled: IconUsers,
      },
      {
        title: "Danger Zone",
        url: `${baseUrl}/danger-zone`,
        icon: IconAlertTriangle,
        iconFilled: IconAlertTriangleFilled,
      },
    ],
    [baseUrl]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return SETTINGS_INDEX.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      return titleMatch || descriptionMatch;
    });
  }, [searchQuery, SETTINGS_INDEX]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      if (value.length > 0) {
        setShouldRenderResults(true);
        requestAnimationFrame(() => {
          setIsResultsVisible(true);
        });
      } else {
        setIsResultsVisible(false);
        setTimeout(() => {
          setShouldRenderResults(false);
        }, 200);
      }
    },
    []
  );

  const handleResultClick = useCallback(
    (url: string) => {
      setIsResultsVisible(false);
      setTimeout(() => {
        setShouldRenderResults(false);
        router.push(url);
        setSearchQuery("");
      }, 200);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchResults.length === 1) {
        e.preventDefault();
        handleResultClick(searchResults[0].url);
      }
    },
    [searchResults, handleResultClick]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsResultsVisible(false);
        setTimeout(() => {
          setShouldRenderResults(false);
        }, 200);
      }
    };

    if (shouldRenderResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [shouldRenderResults]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pathname.includes("/settings")) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  return (
    <Sidebar className="py-2" collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="-p-2">
            <div className="relative" ref={searchContainerRef}>
              <div className="pb-2">
                <div className="relative">
                  <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-8"
                    onBlur={() => setIsInputFocused(false)}
                    onChange={handleSearchChange}
                    onFocus={() => setIsInputFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search settings…"
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                  />
                  {!isInputFocused && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-1 h-[94%] w-20 -translate-y-1/2 bg-linear-to-l from-65% from-background to-transparent"
                    />
                  )}
                  <div
                    className={`absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1 transition-opacity duration-200 ${
                      isInputFocused ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                    <Kbd>K</Kbd>
                  </div>
                </div>
              </div>
              {shouldRenderResults && (
                <div
                  className={`absolute top-full right-2 left-2 z-50 mt-1 flex flex-col rounded-md bg-popover text-popover-foreground text-sm shadow-md ring-1 ring-foreground/10 transition-all duration-200 ease-in-out ${
                    isResultsVisible
                      ? "scale-100 opacity-100"
                      : "scale-[0.95] opacity-0"
                  }`}
                >
                  <ScrollArea className="h-[200px]">
                    <div className="p-1">
                      {searchResults.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {searchResults.map((item) => (
                            <button
                              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
                              key={`${item.type}-${item.title}`}
                              onClick={() => handleResultClick(item.url)}
                              type="button"
                            >
                              <div className="font-medium text-sm">
                                {highlightText(item.title, searchQuery)}
                              </div>
                              {item.type === "card" && (
                                <span className="text-muted-foreground text-xs">
                                  {item.category}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-muted-foreground text-sm">
                          No results found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                const IconComponent = isActive ? item.iconFilled : item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                    >
                      <IconComponent
                        className={`${
                          isActive
                            ? "fill-current text-muted-foreground contrast-200"
                            : ""
                        }`}
                      />
                      <span className="font-[490] text-[13px]">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
