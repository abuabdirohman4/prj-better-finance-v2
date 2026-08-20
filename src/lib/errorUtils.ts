import { getTranslations } from "next-intl/server";

export type ErrorContext =
  | "saving data"
  | "loading data"
  | "deleting data"
  | "updating data"
  | "authentication"
  | "validation"
  | "data migration"
  | "budget calculation"
  | "goal calculation";

export interface ErrorInfo {
  context: ErrorContext;
  message: string;
  originalError?: unknown;
}

export interface ServerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "NEXT_REDIRECT") return "Redirect in progress";
    return error.message;
  }
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

export function handleApiError(error: unknown, context: ErrorContext): ErrorInfo {
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    return { context, message: "Redirect in progress" };
  }

  console.error(`[${context.toUpperCase()}] Error:`, error);
  return {
    context,
    message: getErrorMessage(error),
    originalError: error,
  };
}

// Async because it translates: only ever called from server actions.
export async function handleAuthError(error: unknown): Promise<string> {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();
  const t = await getTranslations("auth");
  if (lower.includes("invalid login credentials")) return t("invalidCredentials");
  if (lower.includes("email not confirmed")) return t("emailNotConfirmed");
  if (lower.includes("too many requests")) return t("tooManyRequests");
  return message;
}

export function isRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}
