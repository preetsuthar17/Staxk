import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimit } from "@/db/schema";

interface RateLimitOptions {
  window: number;
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = options.window * 1000;

  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(rateLimit)
      .where(eq(rateLimit.key, key))
      .limit(1);

    if (existing.length === 0) {
      await tx.insert(rateLimit).values({
        id: randomUUID(),
        key,
        count: 1,
        lastRequest: now,
      });

      return {
        allowed: true,
        remaining: options.max - 1,
        resetAt: now + windowMs,
      };
    }

    const record = existing[0];
    const timeSinceLastRequest = now - record.lastRequest;

    if (timeSinceLastRequest > windowMs) {
      await tx
        .update(rateLimit)
        .set({
          count: 1,
          lastRequest: now,
        })
        .where(eq(rateLimit.key, key));

      return {
        allowed: true,
        remaining: options.max - 1,
        resetAt: now + windowMs,
      };
    }

    if (record.count >= options.max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.lastRequest + windowMs,
      };
    }

    await tx
      .update(rateLimit)
      .set({
        count: sql`${rateLimit.count} + 1`,
        lastRequest: now,
      })
      .where(eq(rateLimit.key, key));

    return {
      allowed: true,
      remaining: options.max - (record.count + 1),
      resetAt: record.lastRequest + windowMs,
    };
  });
}

export function createRateLimitKey(userId: string, endpoint: string): string {
  return `rate_limit:${endpoint}:${userId}`;
}
