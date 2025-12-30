"use client";

import { IconSettings } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AnimatedAvatarProps {
  alt?: string;
  className?: string;
  src: string;
}

function AnimatedAvatar({
  alt = "Avatar",
  className = "",
  src,
}: AnimatedAvatarProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      alt={alt}
      className={`size-full rounded-full object-cover transition-all duration-500 ${
        loaded ? "blur-0" : "blur-md"
      } ${className}`}
      height={32}
      onLoad={() => setLoaded(true)}
      src={src}
      unoptimized
      width={32}
    />
  );
}

interface UserAvatarProps {
  alt?: string;
  dicebearUrl: string;
  fallbackUrl: string;
  userImage?: string | null;
}

function UserAvatar({
  alt,
  dicebearUrl,
  fallbackUrl,
  userImage,
}: UserAvatarProps) {
  return (
    <Avatar>
      <AvatarImage alt={alt} src={userImage || dicebearUrl} />
      <AvatarFallback className="overflow-hidden">
        <AnimatedAvatar alt={alt} src={fallbackUrl} />
      </AvatarFallback>
    </Avatar>
  );
}

interface LoadingUserProfileProps {
  fallbackUrl: string;
}

export function LoadingUserProfile({ fallbackUrl }: LoadingUserProfileProps) {
  return (
    <div className="flex w-full items-center gap-2.5 p-2">
      <Avatar>
        <AvatarFallback className="overflow-hidden">
          <AnimatedAvatar src={fallbackUrl} />
        </AvatarFallback>
      </Avatar>
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

interface UserProfileProps {
  dicebearUrl: string;
  fallbackUrl: string;
  settingsHref: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  } | null;
  username: string;
}

export function UserProfile({
  dicebearUrl,
  fallbackUrl,
  settingsHref,
  user,
  username,
}: UserProfileProps) {
  return (
    <>
      <div className="flex w-full items-center gap-2.5 p-2">
        <UserAvatar
          alt={user?.name || "User avatar"}
          dicebearUrl={dicebearUrl}
          fallbackUrl={fallbackUrl}
          userImage={user?.image}
        />
        <p className="truncate font-medium text-sm">{user?.name || username}</p>
      </div>
      <div className="p-2">
        <Link href={`${settingsHref}/profile`}>
          <Button
            className="cursor-pointer rounded shadow-none hover:bg-card"
            size="icon"
            variant="ghost"
          >
            <IconSettings className="size-4" />
          </Button>
        </Link>
      </div>
    </>
  );
}
