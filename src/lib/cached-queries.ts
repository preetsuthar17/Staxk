import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";
import { getWorkspaceTeams } from "./team";
import { getUserWorkspaces, getWorkspaceBySlug } from "./workspace";

export const getSession = cache(async () => {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
});

export const getCachedWorkspaceBySlug = cache(getWorkspaceBySlug);
export const getCachedUserWorkspaces = cache(getUserWorkspaces);
export const getCachedWorkspaceTeams = cache(getWorkspaceTeams);
