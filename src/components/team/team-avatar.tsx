import { cn } from "@/lib/utils";

interface TeamAvatarProps {
  name: string;
  identifier: string;
  icon?: string | null;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 40,
};

export function TeamAvatar({
  name,
  identifier,
  icon,
  color: _color,
  size = "md",
  className,
}: TeamAvatarProps) {
  const imageSize = sizeMap[size] || sizeMap.md;
  const seed = icon || identifier || "team";

  const dicebearUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex select-none items-center justify-center overflow-hidden rounded-xs bg-muted",
        `size-[${imageSize}px]`,
        className
      )}
      role="img"
      style={{
        width: imageSize,
        height: imageSize,
        minWidth: imageSize,
        minHeight: imageSize,
        maxWidth: imageSize,
        maxHeight: imageSize,
        fontSize: "0",
      }}
      title={name}
    >
      <img
        alt={name}
        aria-hidden="false"
        className="block"
        decoding="async"
        draggable={false}
        height={imageSize}
        loading="lazy"
        src={dicebearUrl}
        style={{ display: "block" }}
        width={imageSize}
      />
    </span>
  );
}
