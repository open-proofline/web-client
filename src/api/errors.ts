import { z } from "zod";

const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
  }
}

export async function apiErrorFromResponse(
  response: Response,
): Promise<ApiError> {
  const fallback = new ApiError("Request failed", {
    status: response.status,
    code: "request_failed",
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }

  try {
    const parsed = apiErrorBodySchema.safeParse(await response.json());
    if (!parsed.success) {
      return fallback;
    }
    return new ApiError(parsed.data.error.message, {
      status: response.status,
      code: parsed.data.error.code,
    });
  } catch {
    return fallback;
  }
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return "The request could not be completed.";
  }
  return "An unknown error occurred.";
}
