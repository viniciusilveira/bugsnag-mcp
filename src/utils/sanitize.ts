const BLOCKED_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-session-token',
  'x-csrf-token',
  'proxy-authorization',
  'x-forwarded-for',
]);

export function sanitizeRequest(
  req: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!req) return null;
  const rawHeaders = req.headers as Record<string, string> | undefined;
  return {
    url: req.url,
    method: req.method,
    referer: req.referer,
    headers: rawHeaders
      ? Object.fromEntries(
          Object.entries(rawHeaders).filter(
            ([k]) => !BLOCKED_HEADERS.has(k.toLowerCase()),
          ),
        )
      : undefined,
    // body and clientIp omitted — may contain passwords, PII
  };
}

// Returns only the user's opaque ID — no PII fields (email, name, ip_address, etc.).
// End-users of monitored applications never consented to share personal data with an LLM.
export function sanitizeUser(
  user: Record<string, unknown> | null | undefined,
): { id: unknown } | null {
  if (!user) return null;
  return { id: user.id };
}

export function sanitizeEvent(
  event: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...event,
    user: sanitizeUser(event.user as Record<string, unknown> | null | undefined),
    request: sanitizeRequest(event.request as Record<string, unknown> | null | undefined),
  };
}
