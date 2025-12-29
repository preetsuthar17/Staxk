import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  user,
  workspace,
  workspaceInvitation,
  workspaceMember,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import { checkRateLimit, createRateLimitKey } from "@/lib/rate-limit";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): {
  valid: boolean;
  error?: string;
  value?: string;
} {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: "Email is too long" };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, value: trimmed };
}

async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<
  | { success: true; workspace: { id: string; name: string; slug: string } }
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

  if (ws.ownerId === userId) {
    return { success: true, workspace: ws };
  }

  const member = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  if (member.length === 0) {
    return {
      success: false,
      error: "You don't have access to this workspace",
      status: 403,
    };
  }

  return { success: true, workspace: ws };
}

async function checkPendingInvitation(
  workspaceId: string,
  validEmail: string
): Promise<{ hasPending: boolean }> {
  const pendingInvitation = await db
    .select({ id: workspaceInvitation.id })
    .from(workspaceInvitation)
    .where(
      and(
        eq(workspaceInvitation.workspaceId, workspaceId),
        eq(workspaceInvitation.email, validEmail),
        eq(workspaceInvitation.status, "pending")
      )
    )
    .limit(1);

  return { hasPending: pendingInvitation.length > 0 };
}

async function checkExistingMember(
  workspaceId: string,
  userId: string
): Promise<{ isMember: boolean }> {
  const existingMember = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  return { isMember: existingMember.length > 0 };
}

export async function POST(
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
      "workspace-invite"
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

    const { email } = body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    if (!emailValidation.value) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const validEmail = emailValidation.value;

    const accessCheck = await verifyWorkspaceAccess(
      workspaceId,
      session.user.id
    );
    if (!accessCheck.success) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    const pendingCheck = await checkPendingInvitation(workspaceId, validEmail);
    if (pendingCheck.hasPending) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, validEmail))
      .limit(1);

    if (existingUser.length > 0) {
      const userId = existingUser[0].id;
      const memberCheck = await checkExistingMember(workspaceId, userId);
      if (memberCheck.isMember) {
        return NextResponse.json(
          { error: "User is already a member of this workspace" },
          { status: 400 }
        );
      }
    }

    const invitationId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(workspaceInvitation).values({
      id: invitationId,
      workspaceId,
      email: validEmail,
      invitedBy: session.user.id,
      status: "pending",
      expiresAt,
    });

    return NextResponse.json({
      id: invitationId,
      email: validEmail,
      workspaceId,
      status: "pending",
    });
  } catch (error) {
    safeError("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
