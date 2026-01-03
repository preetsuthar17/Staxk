import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  NO_FILE: NextResponse.json({ error: "No file provided" }, { status: 400 }),
  INVALID_TYPE: NextResponse.json(
    {
      error: "Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.",
    },
    { status: 400 }
  ),
  FILE_TOO_LARGE: NextResponse.json(
    { error: "File size must be less than 5MB" },
    { status: 400 }
  ),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  FORBIDDEN: NextResponse.json(
    { error: "You don't have permission to update this workspace" },
    { status: 403 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "Failed to upload logo" },
    { status: 500 }
  ),
};

const SUCCESS_RESPONSE_OPTIONS = { status: 200 };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const [formData, session] = await Promise.all([
      request.formData(),
      auth.api.getSession({ headers: request.headers }),
    ]);

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = session.user.id;

    const file = formData.get("logo") as File | null;

    if (!file) {
      return ERRORS.NO_FILE;
    }

    const fileSize = file.size;

    if (fileSize > MAX_FILE_SIZE) {
      return ERRORS.FILE_TOO_LARGE;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return ERRORS.INVALID_TYPE;
    }

    // Check workspace exists and user has permission (owner or admin)
    const [workspaceData] = await db
      .select({
        id: workspace.id,
        role: workspaceMember.role,
      })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        eq(workspace.id, workspaceMember.workspaceId)
      )
      .where(
        and(
          eq(workspace.slug, slug),
          eq(workspaceMember.userId, userId)
        )
      )
      .limit(1);

    if (!workspaceData) {
      return ERRORS.NOT_FOUND;
    }

    if (
      workspaceData.role !== "owner" &&
      workspaceData.role !== "admin"
    ) {
      return ERRORS.FORBIDDEN;
    }

    const [arrayBuffer, workspaceId] = await Promise.all([
      file.arrayBuffer(),
      Promise.resolve(workspaceData.id),
    ]);

    const processedImage = await sharp(arrayBuffer)
      .resize(512, 512, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const dataUrl = `data:image/webp;base64,${processedImage.toString("base64")}`;

    const [updatedWorkspace] = await db
      .update(workspace)
      .set({ logo: dataUrl })
      .where(eq(workspace.id, workspaceId))
      .returning({ logo: workspace.logo });

    if (!updatedWorkspace) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json(
      { imageUrl: updatedWorkspace.logo },
      SUCCESS_RESPONSE_OPTIONS
    );
  } catch (error) {
    console.error("Error uploading logo:", error);
    return ERRORS.SERVER_ERROR;
  }
}

