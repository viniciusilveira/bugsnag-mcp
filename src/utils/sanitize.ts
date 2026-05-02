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

const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'secret', 'token',
  'access_token', 'refresh_token', 'auth_token', 'session_token',
  'api_key', 'apiKey',
  'email', 'email_address', 'ip_address', 'clientIp',
  'phone', 'phone_number', 'ssn', 'cpf', 'credit_card', 'card_number', 'cvv',
]);

export function sanitizeApiResponse(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => sanitizeApiResponse(item));

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (key === 'body') continue;
    if (key === 'headers' && val && typeof val === 'object' && !Array.isArray(val)) {
      const rawHeaders = val as Record<string, string>;
      result[key] = Object.fromEntries(
        Object.entries(rawHeaders).filter(([h]) => !BLOCKED_HEADERS.has(h.toLowerCase())),
      );
      continue;
    }
    result[key] = sanitizeApiResponse(val);
  }
  return result;
}

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
