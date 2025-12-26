import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authHandler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  return await authHandler.GET(request);
}

export async function POST(request: NextRequest) {
  return await authHandler.POST(request);
}
