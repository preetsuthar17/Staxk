"use client";

import { IconMoodSmile } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EmojiCategory = {
  name: string;
  emojis: string[];
};

const EMOJI_CATEGORIES: Record<string, EmojiCategory> = {
  smileys: {
    name: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "😮‍💨",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
    ],
  },
  objects: {
    name: "Objects",
    emojis: [
      "📦",
      "📁",
      "📂",
      "🗂️",
      "📋",
      "📌",
      "📍",
      "📎",
      "🔗",
      "📐",
      "📏",
      "✂️",
      "🗃️",
      "🗄️",
      "🗑️",
      "🔒",
      "🔓",
      "🔑",
      "🔨",
      "⚒️",
      "🛠️",
      "⚙️",
      "🔧",
      "🔩",
      "⚡",
      "💡",
      "🔦",
      "🕯️",
      "🧯",
      "🛢️",
      "💰",
      "💳",
      "💎",
      "⚖️",
      "🔮",
      "🧿",
      "🧲",
      "🧪",
      "🧫",
      "🧬",
      "🔬",
      "🔭",
      "📡",
      "💻",
      "🖥️",
      "🖨️",
      "⌨️",
      "🖱️",
      "💾",
      "💿",
    ],
  },
  symbols: {
    name: "Symbols",
    emojis: [
      "⭐",
      "🌟",
      "✨",
      "💫",
      "⚡",
      "🔥",
      "💥",
      "💢",
      "💦",
      "💨",
      "🕳️",
      "💣",
      "💬",
      "👁️‍🗨️",
      "🗨️",
      "🗯️",
      "💭",
      "💤",
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "❤️‍🔥",
      "❤️‍🩹",
      "✅",
      "❌",
      "⭕",
      "❗",
      "❓",
      "‼️",
      "⁉️",
      "💯",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
    ],
  },
  nature: {
    name: "Nature",
    emojis: [
      "🌸",
      "💐",
      "🌷",
      "🌹",
      "🥀",
      "🌺",
      "🌻",
      "🌼",
      "🌱",
      "🌲",
      "🌳",
      "🌴",
      "🌵",
      "🎋",
      "🎍",
      "🌾",
      "🍀",
      "🍁",
      "🍂",
      "🍃",
      "🍄",
      "🌰",
      "🐚",
      "🌊",
      "🌫️",
      "🌈",
      "☀️",
      "🌤️",
      "⛅",
      "🌥️",
      "☁️",
      "🌦️",
      "🌧️",
      "⛈️",
      "🌩️",
      "🌨️",
      "❄️",
      "☃️",
      "⛄",
      "🔥",
      "🌿",
      "☘️",
      "🪴",
      "🌍",
      "🌎",
      "🌏",
      "🪨",
      "💧",
      "🌙",
      "⭐",
    ],
  },
  food: {
    name: "Food",
    emojis: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥯",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
    ],
  },
  activities: {
    name: "Activities",
    emojis: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛼",
      "🛷",
      "⛸️",
      "🥌",
      "🎿",
      "⛷️",
      "🏂",
      "🪂",
      "🏋️",
      "🤸",
      "🎯",
      "🎮",
      "🕹️",
      "🎰",
      "🎲",
      "🧩",
      "🎭",
      "🎨",
      "🎬",
      "🎤",
      "🎧",
      "🎼",
    ],
  },
  travel: {
    name: "Travel",
    emojis: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🛻",
      "🚚",
      "🚛",
      "🚜",
      "🏍️",
      "🛵",
      "🚲",
      "🛴",
      "🛹",
      "🚏",
      "🛣️",
      "🛤️",
      "🛢️",
      "⛽",
      "🚨",
      "🚥",
      "🚦",
      "🛑",
      "🚧",
      "⚓",
      "⛵",
      "🛶",
      "🚤",
      "🛳️",
      "⛴️",
      "🛥️",
      "🚢",
      "✈️",
      "🛩️",
      "🛫",
      "🛬",
      "🪂",
      "💺",
      "🚁",
      "🚟",
      "🚠",
      "🚡",
      "🛰️",
      "🚀",
      "🛸",
    ],
  },
  flags: {
    name: "Flags",
    emojis: [
      "🏁",
      "🚩",
      "🎌",
      "🏴",
      "🏳️",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🏴‍☠️",
      "🇦🇺",
      "🇧🇷",
      "🇨🇦",
      "🇨🇳",
      "🇫🇷",
      "🇩🇪",
      "🇮🇳",
      "🇮🇹",
      "🇯🇵",
      "🇲🇽",
      "🇳🇱",
      "🇷🇺",
      "🇪🇸",
      "🇬🇧",
      "🇺🇸",
      "🇰🇷",
      "🇸🇪",
      "🇨🇭",
      "🇵🇱",
      "🇵🇹",
      "🇳🇴",
      "🇫🇮",
    ],
  },
};

const RECENT_EMOJIS_KEY = "emoji-picker-recent";
const MAX_RECENT = 20;

interface EmojiPickerProps {
  value?: string | null;
  onChange?: (emoji: string) => void;
  onRemove?: () => void;
  trigger?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function EmojiPicker({
  value,
  onChange,
  onRemove,
  trigger,
  className,
  disabled,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("smileys");

  const recentEmojis = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [open]);

  const saveRecentEmoji = useCallback((emoji: string) => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      const recent: string[] = stored ? JSON.parse(stored) : [];
      const filtered = recent.filter((e) => e !== emoji);
      const updated = [emoji, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const handleSelect = useCallback(
    (emoji: string) => {
      onChange?.(emoji);
      saveRecentEmoji(emoji);
      setOpen(false);
      setSearch("");
    },
    [onChange, saveRecentEmoji]
  );

  const handleRemove = useCallback(() => {
    onRemove?.();
    setOpen(false);
  }, [onRemove]);

  const filteredCategories = useMemo((): Record<string, EmojiCategory> => {
    if (!search.trim()) {
      return EMOJI_CATEGORIES;
    }

    const searchLower = search.toLowerCase();
    const result: Record<string, EmojiCategory> = {};

    for (const [key, category] of Object.entries(EMOJI_CATEGORIES)) {
      const filtered = category.emojis.filter(() => {
        return category.name.toLowerCase().includes(searchLower);
      });
      if (filtered.length > 0) {
        result[key] = { ...category, emojis: filtered };
      }
    }

    if (Object.keys(result).length === 0) {
      return EMOJI_CATEGORIES;
    }

    return result;
  }, [search]);

  const currentCategory = filteredCategories[activeCategory];

  const triggerElement = trigger || (
    <button
      className={cn(
        "flex size-10 items-center justify-center rounded-md border text-lg transition-colors hover:bg-accent disabled:opacity-50",
        className
      )}
      disabled={disabled}
      type="button"
    >
      {value || <IconMoodSmile className="size-5 text-muted-foreground" />}
    </button>
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger disabled={disabled}>{triggerElement}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex flex-col">
          <div className="border-b p-2">
            <Input
              className="h-8"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emojis..."
              value={search}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto border-b p-1">
            {recentEmojis.length > 0 && (
              <button
                className={cn(
                  "rounded px-2 py-1 text-xs transition-colors",
                  activeCategory === "recent"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setActiveCategory("recent")}
                type="button"
              >
                Recent
              </button>
            )}
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <button
                className={cn(
                  "whitespace-nowrap rounded px-2 py-1 text-xs transition-colors",
                  activeCategory === key
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                key={key}
                onClick={() => setActiveCategory(key)}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {activeCategory === "recent" && recentEmojis.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 font-medium text-muted-foreground text-xs">
                  Recent
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((emoji: string, index: number) => (
                    <button
                      className="flex size-8 items-center justify-center rounded text-lg transition-colors hover:bg-accent"
                      key={`${emoji}-${index}`}
                      onClick={() => handleSelect(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCategory !== "recent" && currentCategory && (
              <div>
                <div className="mb-1 font-medium text-muted-foreground text-xs">
                  {currentCategory.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {currentCategory.emojis.map(
                    (emoji: string, index: number) => (
                      <button
                        className="flex size-8 items-center justify-center rounded text-lg transition-colors hover:bg-accent"
                        key={`${emoji}-${index}`}
                        onClick={() => handleSelect(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {value && onRemove && (
            <div className="border-t p-2">
              <button
                className="w-full rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={handleRemove}
                type="button"
              >
                Remove emoji
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
