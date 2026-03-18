import { NextResponse } from "next/server";
import type { z } from "zod";

export type ApiError = {
  code: string;
  message: string;
  issues?: unknown;
};

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { data, error: null } satisfies ApiResponse<T>,
    { status }
  );
}

export function jsonError(error: ApiError, status: number) {
  return NextResponse.json(
    { data: null, error } satisfies ApiResponse<never>,
    { status }
  );
}

/** Parse request body with Zod; returns NextResponse 400 with issues on failure. */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: jsonError(
        { code: "INVALID_JSON", message: "Corpo da requisição inválido." },
        400
      ),
    };
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data as z.infer<T> };
  }
  return {
    success: false,
    response: jsonError(
      {
        code: "VALIDATION_ERROR",
        message: parsed.error.message,
        issues: parsed.error.issues,
      },
      400
    ),
  };
}
