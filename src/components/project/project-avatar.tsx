import { cn } from "@/lib/utils";

interface ProjectAvatarProps {
  name: string;
  identifier: string;
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
};

const defaultColors = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

function getColorFromIdentifier(identifier: string): string {
  const hash = identifier
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[hash % defaultColors.length];
}

export function ProjectAvatar({
  name,
  identifier,
  icon,
  color,
  size = "md",
  className,
}: ProjectAvatarProps) {
  const bgColor = color || getColorFromIdentifier(identifier);
  const displayContent = icon || identifier.slice(0, 2);

  return (
    <div
      className={cn(
        "flex select-none items-center justify-center rounded-md font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {displayContent}
    </div>
  );
}
