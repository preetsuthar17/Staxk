import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";
import {
  sanitizeWorkspaceDescription,
  sanitizeWorkspaceName,
} from "@/lib/sanitize";

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 30;
const RESERVED_SLUGS = [
  "api",
  "auth",
  "login",
  "signup",
  "logout",
  "onboarding",
  "settings",
  "admin",
  "dashboard",
  "home",
  "workspace",
  "workspaces",
  "app",
  "help",
  "support",
  "docs",
  "blog",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "legal",
];

function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  if (slug.length < MIN_SLUG_LENGTH) {
    return {
      valid: false,
      error: `Slug must be at least ${MIN_SLUG_LENGTH} characters`,
    };
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return {
      valid: false,
      error: `Slug must be at most ${MAX_SLUG_LENGTH} characters`,
    };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.endsWith("-")) {
    return { valid: false, error: "Slug cannot end with a hyphen" };
  }

  if (slug.includes("--")) {
    return { valid: false, error: "Slug cannot contain consecutive hyphens" };
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: "This slug is reserved" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const sizeError = validateBodySize(request);
    if (sizeError) {
      return sizeError;
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }
    const { name, slug, description, isOnboarding } = body;

    const sanitizedName = sanitizeWorkspaceName(name);
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Name is required and must be 1-50 characters" },
        { status: 400 }
      );
    }

    const sanitizedDescription = sanitizeWorkspaceDescription(description);
    if (
      description !== null &&
      description !== undefined &&
      !sanitizedDescription
    ) {
      return NextResponse.json(
        { error: "Description must be at most 500 characters" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug?.toLowerCase().trim();
    const validation = validateSlug(normalizedSlug);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.slug, normalizedSlug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 400 }
      );
    }

    const workspaceId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(workspace).values({
        id: workspaceId,
        name: sanitizedName,
        slug: normalizedSlug,
        description: sanitizedDescription,
        timezone: "UTC",
        ownerId: session.user.id,
      });

      await tx.insert(workspaceMember).values({
        id: memberId,
        workspaceId,
        userId: session.user.id,
        role: "owner",
      });

      if (isOnboarding) {
        await tx
          .update(user)
          .set({ isOnboarded: true })
          .where(eq(user.id, session.user.id));
      }
    });

    return NextResponse.json({
      id: workspaceId,
      name: sanitizedName,
      slug: normalizedSlug,
      description: sanitizedDescription,
    });
  } catch (error) {
    safeError("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
