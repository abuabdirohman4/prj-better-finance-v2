export type ErrorContext =
  | "menyimpan data"
  | "memuat data"
  | "menghapus data"
  | "mengupdate data"
  | "autentikasi"
  | "validasi"
  | "migrasi data"
  | "kalkulasi budget"
  | "kalkulasi goal";

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
  return "Terjadi kesalahan yang tidak diketahui";
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

export function handleAuthError(error: unknown): string {
  const message = getErrorMessage(error);
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email atau password salah";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Email belum diverifikasi. Cek inbox kamu";
  }
  if (message.toLowerCase().includes("too many requests")) {
    return "Terlalu banyak percobaan login. Coba lagi nanti";
  }
  return message;
}

export function isRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}
