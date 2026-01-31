import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { type IssueStatus, issue } from "@/db/schema/issue";
import { auth } from "@/lib/auth";
import { canManageIssue, getIssueById } from "@/lib/issue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10_000;

const VALID_STATUSES: IssueStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "canceled",
  "duplicate",
];

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  NOT_FOUND: NextResponse.json({ error: "Issue not found" }, { status: 404 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

function validateIssuePatchBody(body: {
  title?: string;
  description?: string;
  status?: IssueStatus;
}): NextResponse | { updates: Record<string, string | null> } {
  const updates: Record<string, string | null> = {};

  if (body.title !== undefined) {
    const trimmedTitle = body.title.trim();
    if (
      trimmedTitle.length < MIN_TITLE_LENGTH ||
      trimmedTitle.length > MAX_TITLE_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`,
        },
        { status: 400 }
      );
    }
    updates.title = trimmedTitle;
  }

  if (body.description !== undefined) {
    let trimmedDescription: string | null = null;
    if (typeof body.description === "string") {
      trimmedDescription = body.description.trim() || null;
      if (
        trimmedDescription &&
        trimmedDescription.length > MAX_DESCRIPTION_LENGTH
      ) {
        return NextResponse.json(
          {
            error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`,
          },
          { status: 400 }
        );
      }
    }
    updates.description = trimmedDescription;
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  return { updates };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { id: issueId } = await params;

    const issueData = await getIssueById(issueId, userId);

    if (!issueData) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({
      issue: {
        id: issueData.id,
        number: issueData.number,
        title: issueData.title,
        description: issueData.description,
        status: issueData.status,
        projectId: issueData.projectId,
        projectIdentifier: issueData.projectIdentifier,
        projectName: issueData.projectName,
        identifier: `${issueData.projectIdentifier}-${issueData.number}`,
        createdById: issueData.createdById,
        createdByName: issueData.createdByName,
        createdByEmail: issueData.createdByEmail,
        createdAt: issueData.createdAt,
        updatedAt: issueData.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting issue:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { id: issueId } = await params;

    const issueData = await getIssueById(issueId, userId);

    if (!issueData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageIssue(issueId, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    let body: {
      title?: string;
      description?: string;
      status?: IssueStatus;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = validateIssuePatchBody(body);
    if (validated instanceof NextResponse) {
      return validated;
    }
    const { updates } = validated;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db.update(issue).set(updates).where(eq(issue.id, issueId));

    return NextResponse.json({
      issue: {
        id: issueData.id,
        number: issueData.number,
        title: updates.title ?? issueData.title,
        description:
          updates.description !== undefined
            ? updates.description
            : issueData.description,
        status: updates.status ?? issueData.status,
        projectIdentifier: issueData.projectIdentifier,
        identifier: `${issueData.projectIdentifier}-${issueData.number}`,
      },
    });
  } catch (error) {
    console.error("Error updating issue:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { id: issueId } = await params;

    const issueData = await getIssueById(issueId, userId);

    if (!issueData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageIssue(issueId, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    await db.delete(issue).where(eq(issue.id, issueId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return ERRORS.SERVER_ERROR;
  }
}
