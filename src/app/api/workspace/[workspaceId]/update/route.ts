import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { validateBase64Image } from "@/lib/image-validation";
import { safeError } from "@/lib/logger";
import { checkRateLimit, createRateLimitKey } from "@/lib/rate-limit";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";
import {
  sanitizeWorkspaceDescription,
  sanitizeWorkspaceName,
} from "@/lib/sanitize";
import { isValidTimezone } from "@/lib/timezone";

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

function validateName(name: unknown): {
  valid: boolean;
  error?: string;
  value?: string;
} {
  const sanitized = sanitizeWorkspaceName(name);
  if (!sanitized) {
    return {
      valid: false,
      error: "Name is required and must be 1-50 characters",
    };
  }

  return { valid: true, value: sanitized };
}

function validateDescription(description: unknown): {
  valid: boolean;
  error?: string;
  value?: string | null;
} {
  if (description === null || description === undefined) {
    return { valid: true, value: null };
  }

  const sanitized = sanitizeWorkspaceDescription(description);
  if (description !== null && description !== undefined && !sanitized) {
    return {
      valid: false,
      error: "Description must be at most 500 characters",
    };
  }

  return { valid: true, value: sanitized };
}

function validateLogo(logo: unknown): {
  valid: boolean;
  error?: string;
  value?: string | null;
} {
  const validation = validateBase64Image(logo as string | null);
  return validation;
}

function validateTimezone(timezone: unknown): {
  valid: boolean;
  error?: string;
  value?: string;
} {
  if (typeof timezone !== "string") {
    return { valid: false, error: "Timezone must be a string" };
  }

  if (!timezone.trim()) {
    return { valid: false, error: "Timezone cannot be empty" };
  }

  if (!isValidTimezone(timezone)) {
    return { valid: false, error: "Invalid timezone identifier" };
  }

  return { valid: true, value: timezone.trim() };
}

async function validateSlugAvailability(
  slug: string,
  currentSlug: string
): Promise<{ valid: boolean; error?: string }> {
  if (slug === currentSlug) {
    return { valid: true };
  }

  const existing = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return { valid: false, error: "This slug is already taken" };
  }

  return { valid: true };
}

async function getWorkspaceAndVerifyOwnership(
  workspaceId: string,
  userId: string
): Promise<
  | {
      success: true;
      workspace: { id: string; name: string; slug: string; ownerId: string };
    }
  | { success: false; error: string; status: number }
> {
  const workspaceData = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    })
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1);

  if (workspaceData.length === 0) {
    return { success: false, error: "Workspace not found", status: 404 };
  }

  const ws = workspaceData[0];

  if (ws.ownerId !== userId) {
    return { success: false, error: "Forbidden", status: 403 };
  }

  return { success: true, workspace: ws };
}

function processNameField(
  name: unknown,
  updateData: { name?: string }
): { success: false; error: string } | { success: true } {
  const validation = validateName(name);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid name" };
  }
  updateData.name = validation.value;
  return { success: true };
}

async function processSlugField(
  slug: unknown,
  currentSlug: string,
  updateData: { slug?: string }
): Promise<{ success: false; error: string } | { success: true }> {
  const normalizedSlug = String(slug).toLowerCase().trim();
  const validation = validateSlug(normalizedSlug);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid slug" };
  }

  const availabilityCheck = await validateSlugAvailability(
    normalizedSlug,
    currentSlug
  );
  if (!availabilityCheck.valid) {
    return {
      success: false,
      error: availabilityCheck.error || "Slug unavailable",
    };
  }

  updateData.slug = normalizedSlug;
  return { success: true };
}

function processDescriptionField(
  description: unknown,
  updateData: { description?: string | null }
): { success: false; error: string } | { success: true } {
  const validation = validateDescription(description);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Invalid description",
    };
  }
  updateData.description = validation.value;
  return { success: true };
}

function processLogoField(
  logo: unknown,
  updateData: { logo?: string | null }
): { success: false; error: string } | { success: true } {
  const validation = validateLogo(logo);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid logo" };
  }
  updateData.logo = validation.value;
  return { success: true };
}

function processTimezoneField(
  timezone: unknown,
  updateData: { timezone?: string }
): { success: false; error: string } | { success: true } {
  const validation = validateTimezone(timezone);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Invalid timezone",
    };
  }
  updateData.timezone = validation.value;
  return { success: true };
}

type FieldProcessor = (
  value: unknown,
  updateData: {
    name?: string;
    slug?: string;
    description?: string | null;
    logo?: string | null;
    timezone?: string;
  }
) =>
  | Promise<{ success: false; error: string } | { success: true }>
  | { success: false; error: string }
  | { success: true };

async function processFieldUpdates(
  body: {
    name?: unknown;
    slug?: unknown;
    description?: unknown;
    logo?: unknown;
    timezone?: unknown;
  },
  currentWorkspace: { slug: string }
): Promise<
  | {
      success: true;
      updateData: {
        name?: string;
        slug?: string;
        description?: string | null;
        logo?: string | null;
        timezone?: string;
      };
    }
  | { success: false; error: string }
> {
  const updateData: {
    name?: string;
    slug?: string;
    description?: string | null;
    logo?: string | null;
    timezone?: string;
  } = {};

  const fieldProcessors: Array<{
    value: unknown;
    processor: FieldProcessor;
  }> = [
    {
      value: body.name,
      processor: (val, data) => processNameField(val, data),
    },
    {
      value: body.slug,
      processor: async (val, data) =>
        await processSlugField(val, currentWorkspace.slug, data),
    },
    {
      value: body.description,
      processor: (val, data) => processDescriptionField(val, data),
    },
    {
      value: body.logo,
      processor: (val, data) => processLogoField(val, data),
    },
    {
      value: body.timezone,
      processor: (val, data) => processTimezoneField(val, data),
    },
  ];

  for (const { value, processor } of fieldProcessors) {
    if (value !== undefined) {
      const result = await processor(value, updateData);
      if (!result.success) {
        return result;
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  return { success: true, updateData };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const sizeError = validateBodySize(request);
    if (sizeError) {
      return sizeError;
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = createRateLimitKey(
      session.user.id,
      "workspace-update"
    );
    const rateLimitResult = await checkRateLimit(rateLimitKey, {
      window: 60,
      max: 10,
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const { workspaceId } = await params;
    const body = await request.json();

    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }

    const workspaceCheck = await getWorkspaceAndVerifyOwnership(
      workspaceId,
      session.user.id
    );

    if (!workspaceCheck.success) {
      return NextResponse.json(
        { error: workspaceCheck.error },
        { status: workspaceCheck.status }
      );
    }

    const fieldUpdates = await processFieldUpdates(
      body,
      workspaceCheck.workspace
    );

    if (!fieldUpdates.success) {
      return NextResponse.json({ error: fieldUpdates.error }, { status: 400 });
    }

    const updated = await db
      .update(workspace)
      .set(fieldUpdates.updateData)
      .where(eq(workspace.id, workspaceId))
      .returning({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        timezone: workspace.timezone,
      });

    return NextResponse.json(updated[0]);
  } catch (error) {
    safeError("Error updating workspace:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
