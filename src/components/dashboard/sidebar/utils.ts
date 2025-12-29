export function getWorkspaceSlug(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    segments[0] !== "settings" &&
    segments[0] !== "onboarding" &&
    segments[0] !== "home" &&
    segments[0] !== "login" &&
    segments[0] !== "signup" &&
    segments[0] !== "inbox"
  ) {
    return segments[0];
  }
  return null;
}

export function buildWorkspaceUrl(
  workspaceSlug: string | null,
  path: string
): string {
  if (!workspaceSlug) {
    return path;
  }

  if (path === "/" || path === "") {
    return `/${workspaceSlug}`;
  }

  return `/${workspaceSlug}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isWorkspaceRouteActive(
  pathname: string,
  workspaceSlug: string | null,
  href: string
): boolean {
  if (!workspaceSlug) {
    return false;
  }

  if (href === "/" || href === "") {
    return (
      pathname === `/${workspaceSlug}` || pathname === `/${workspaceSlug}/`
    );
  }

  const workspaceHref = buildWorkspaceUrl(workspaceSlug, href);
  return pathname === workspaceHref || pathname.startsWith(`${workspaceHref}/`);
}
