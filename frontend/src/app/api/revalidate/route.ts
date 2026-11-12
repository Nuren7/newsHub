import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RevalidationPayload {
  post_id: number;
  slug: string;
  status: string;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.NEWSHUB_REVALIDATION_SECRET;

  if (!expectedSecret) {
    console.error("NEWSHUB_REVALIDATION_SECRET is not configured.");
    return NextResponse.json(
      { error: "Revalidation is not configured." },
      { status: 503 },
    );
  }

  const providedSecret = request.headers.get(
    "X-NewsHub-Revalidation-Secret",
  );

  if (!providedSecret || !secretsMatch(expectedSecret, providedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRevalidationPayload(payload)) {
    return NextResponse.json(
      { error: "Invalid revalidation payload." },
      { status: 400 },
    );
  }

  revalidatePath("/", "page");
  revalidatePath("/article/[slug]", "page");

  return NextResponse.json({
    revalidated: true,
    postId: payload.post_id,
    slug: payload.slug,
    status: payload.status,
  });
}

function isRevalidationPayload(value: unknown): value is RevalidationPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.post_id === "number" &&
    Number.isSafeInteger(payload.post_id) &&
    payload.post_id > 0 &&
    typeof payload.slug === "string" &&
    payload.slug.length > 0 &&
    payload.slug.length <= 200 &&
    typeof payload.status === "string" &&
    payload.status.length > 0
  );
}

function secretsMatch(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);

  return (
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes)
  );
}
