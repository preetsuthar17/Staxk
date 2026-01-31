import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspace";

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const workspaces = await getUserWorkspaces(userId);

    return NextResponse.json(
      { workspaces },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return ERRORS.SERVER_ERROR;
  }
}
