/** Domain errors may be shown; database/transport diagnostics stay on the server. */
export function publicError(error: unknown, fallback: string) {
  if (!(error instanceof Error) || error.name !== "Error" || "code" in error) return fallback;
  if (error.message.length > 300 || /prisma|invocation|connection string|postgres|supabase/i.test(error.message)) return fallback;
  return error.message || fallback;
}
