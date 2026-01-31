import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { type IssueStatus, issue } from "@/db/schema/issue";
import { project } from "@/db/schema/project";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import { getNextIssueNumber } from "@/lib/issue";

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
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function POST(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;

    let body: {
      workspaceSlug?: string;
      projectId?: string;
      title?: string;
      description?: string;
      status?: IssueStatus;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      workspaceSlug,
      projectId,
      title,
      description,
      status = "backlog",
    } = body;

    if (!(workspaceSlug && projectId && title)) {
      return NextResponse.json(
        { error: "workspaceSlug, projectId, and title are required" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({
        id: workspace.id,
      })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const { id: workspaceId } = workspaceResult[0];

    const projectResult = await db
      .select({
        id: project.id,
        identifier: project.identifier,
      })
      .from(project)
      .where(
        and(eq(project.id, projectId), eq(project.workspaceId, workspaceId))
      )
      .limit(1);

    if (projectResult.length === 0) {
      return NextResponse.json(
        { error: "Project not found in this workspace" },
        { status: 404 }
      );
    }

    const { identifier: projectIdentifier } = projectResult[0];

    const trimmedTitle = title.trim();
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

    const trimmedDescription = description?.trim() || null;
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

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const issueNumber = await getNextIssueNumber(projectId);

    const issueId = crypto.randomUUID();

    await db.insert(issue).values({
      id: issueId,
      number: issueNumber,
      title: trimmedTitle,
      description: trimmedDescription,
      status,
      projectId,
      workspaceId,
      createdById: userId,
    });

    return NextResponse.json(
      {
        issue: {
          id: issueId,
          number: issueNumber,
          title: trimmedTitle,
          identifier: `${projectIdentifier}-${issueNumber}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating issue:", error);
    return ERRORS.SERVER_ERROR;
  }
}
