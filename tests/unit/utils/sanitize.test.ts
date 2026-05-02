import { sanitizeRequest, sanitizeUser, sanitizeEvent, sanitizeApiResponse } from '../../../src/utils/sanitize';
import { describe, it, expect } from '@jest/globals';

describe('sanitizeUser', () => {
  it('retains id', () => {
    const result = sanitizeUser({ id: 'user_123', email: 'a@b.com', name: 'Alice' });
    expect(result).toEqual({ id: 'user_123' });
  });

  it('strips email', () => {
    const result = sanitizeUser({ id: '1', email: 'secret@example.com' });
    expect(result).not.toHaveProperty('email');
  });

  it('strips name', () => {
    const result = sanitizeUser({ id: '1', name: 'Alice' });
    expect(result).not.toHaveProperty('name');
  });

  it('strips ip_address', () => {
    const result = sanitizeUser({ id: '1', ip_address: '1.2.3.4' });
    expect(result).not.toHaveProperty('ip_address');
  });

  it('returns null for null input', () => {
    expect(sanitizeUser(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(sanitizeUser(undefined)).toBeNull();
  });
});

describe('sanitizeRequest', () => {
  const baseRequest = {
    url: 'https://example.com/api',
    method: 'POST',
    referer: 'https://example.com',
    headers: {
      'user-agent': 'Mozilla/5.0',
      'content-type': 'application/json',
      'authorization': 'Bearer token123',
      'cookie': 'session=abc',
      'x-api-key': 'key-123',
      'x-auth-token': 'auth-456',
      'x-session-token': 'sess-789',
      'x-csrf-token': 'csrf-000',
      'proxy-authorization': 'Basic xyz',
      'x-forwarded-for': '1.2.3.4',
    },
    body: { password: 'hunter2' },
    clientIp: '203.0.113.42',
  };

  it('strips authorization header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('authorization');
  });

  it('strips cookie header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('cookie');
  });

  it('strips x-api-key header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('x-api-key');
  });

  it('strips x-auth-token header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('x-auth-token');
  });

  it('strips x-session-token header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('x-session-token');
  });

  it('strips x-csrf-token header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('x-csrf-token');
  });

  it('strips proxy-authorization header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('proxy-authorization');
  });

  it('strips x-forwarded-for header', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).not.toHaveProperty('x-forwarded-for');
  });

  it('strips body', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result).not.toHaveProperty('body');
  });

  it('strips clientIp', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result).not.toHaveProperty('clientIp');
  });

  it('retains url, method, and referer', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.url).toBe('https://example.com/api');
    expect(result?.method).toBe('POST');
    expect(result?.referer).toBe('https://example.com');
  });

  it('retains safe headers (content-type, user-agent)', () => {
    const result = sanitizeRequest(baseRequest);
    expect(result?.headers).toHaveProperty('content-type', 'application/json');
    expect(result?.headers).toHaveProperty('user-agent', 'Mozilla/5.0');
  });

  it('returns null for null input', () => {
    expect(sanitizeRequest(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(sanitizeRequest(undefined)).toBeNull();
  });

  it('handles missing headers gracefully', () => {
    const result = sanitizeRequest({ url: 'https://example.com', method: 'GET' });
    expect(result?.headers).toBeUndefined();
  });
});

describe('sanitizeEvent', () => {
  const event = {
    id: 'event_123',
    error_id: 'error_456',
    received_at: '2024-01-01T00:00:00Z',
    severity: 'error',
    context: 'UserController',
    app: { version: '1.0.0' },
    device: { osName: 'Linux' },
    exceptions: [{ errorClass: 'TypeError', message: 'oops' }],
    breadcrumbs: [{ name: 'click' }],
    metaData: { custom: { key: 'value' } },
    user: {
      id: 'user_123',
      email: 'user@example.com',
      name: 'Alice',
    },
    request: {
      url: 'https://example.com',
      method: 'GET',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: { secret: 'pw' },
      clientIp: '1.2.3.4',
    },
  };

  it('sanitizes user (strips email)', () => {
    const result = sanitizeEvent(event);
    expect((result.user as Record<string, unknown>)).not.toHaveProperty('email');
    expect((result.user as Record<string, unknown>)).toHaveProperty('id', 'user_123');
  });

  it('sanitizes request (strips authorization header)', () => {
    const result = sanitizeEvent(event);
    const headers = (result.request as Record<string, unknown>)?.headers as Record<string, unknown>;
    expect(headers).not.toHaveProperty('authorization');
  });

  it('sanitizes request (strips body)', () => {
    const result = sanitizeEvent(event);
    expect(result.request).not.toHaveProperty('body');
  });

  it('sanitizes request (strips clientIp)', () => {
    const result = sanitizeEvent(event);
    expect(result.request).not.toHaveProperty('clientIp');
  });

  it('preserves all non-PII top-level fields', () => {
    const result = sanitizeEvent(event);
    expect(result.id).toBe('event_123');
    expect(result.error_id).toBe('error_456');
    expect(result.severity).toBe('error');
    expect(result.context).toBe('UserController');
    expect(result.app).toEqual({ version: '1.0.0' });
    expect(result.device).toEqual({ osName: 'Linux' });
    expect(result.exceptions).toEqual([{ errorClass: 'TypeError', message: 'oops' }]);
    expect(result.breadcrumbs).toEqual([{ name: 'click' }]);
    expect(result.metaData).toEqual({ custom: { key: 'value' } });
  });

  it('handles absent user gracefully', () => {
    const result = sanitizeEvent({ ...event, user: null });
    expect(result.user).toBeNull();
  });

  it('handles absent request gracefully', () => {
    const result = sanitizeEvent({ ...event, request: undefined });
    expect(result.request).toBeNull();
  });
});

describe('sanitizeApiResponse', () => {
  it('passes null through unchanged', () => {
    expect(sanitizeApiResponse(null)).toBeNull();
  });

  it('passes undefined through unchanged', () => {
    expect(sanitizeApiResponse(undefined)).toBeUndefined();
  });

  it('passes strings through unchanged', () => {
    expect(sanitizeApiResponse('hello')).toBe('hello');
  });

  it('passes numbers through unchanged', () => {
    expect(sanitizeApiResponse(42)).toBe(42);
  });

  it('passes booleans through unchanged', () => {
    expect(sanitizeApiResponse(true)).toBe(true);
  });

  it('removes email at top level', () => {
    const result = sanitizeApiResponse({ id: '1', email: 'user@example.com' }) as any;
    expect(result).not.toHaveProperty('email');
    expect(result).toHaveProperty('id', '1');
  });

  it('removes password at top level', () => {
    const result = sanitizeApiResponse({ id: '1', password: 'secret' }) as any;
    expect(result).not.toHaveProperty('password');
  });

  it('removes token at top level', () => {
    const result = sanitizeApiResponse({ id: '1', token: 'abc123' }) as any;
    expect(result).not.toHaveProperty('token');
  });

  it('removes ip_address at top level', () => {
    const result = sanitizeApiResponse({ id: '1', ip_address: '1.2.3.4' }) as any;
    expect(result).not.toHaveProperty('ip_address');
  });

  it('removes clientIp at any level', () => {
    const result = sanitizeApiResponse({ request: { url: '/api', clientIp: '1.2.3.4' } }) as any;
    expect(result.request).not.toHaveProperty('clientIp');
  });

  it('removes cpf at top level', () => {
    const result = sanitizeApiResponse({ id: '1', cpf: '123.456.789-00' }) as any;
    expect(result).not.toHaveProperty('cpf');
  });

  it('removes credit_card at top level', () => {
    const result = sanitizeApiResponse({ id: '1', credit_card: '4111111111111111' }) as any;
    expect(result).not.toHaveProperty('credit_card');
  });

  it('removes api_key (snake_case) at top level', () => {
    const result = sanitizeApiResponse({ id: '1', api_key: 'test-api-key' }) as any;
    expect(result).not.toHaveProperty('api_key');
    expect(result).toHaveProperty('id', '1');
  });

  it('removes apiKey (camelCase) at top level', () => {
    const result = sanitizeApiResponse({ id: '1', apiKey: 'test-api-key' }) as any;
    expect(result).not.toHaveProperty('apiKey');
  });

  it('retains name at top level (not PII in org/project context)', () => {
    const result = sanitizeApiResponse({ id: '1', name: 'My Project' }) as any;
    expect(result).toHaveProperty('name', 'My Project');
  });

  it('removes email nested inside user object', () => {
    const result = sanitizeApiResponse({
      user: { id: 'u1', email: 'user@example.com' },
    }) as any;
    expect(result.user).not.toHaveProperty('email');
    expect(result.user).toHaveProperty('id', 'u1');
  });

  it('removes password nested inside metaData', () => {
    const result = sanitizeApiResponse({
      metaData: { auth: { password: 'secret', username: 'alice' } },
    }) as any;
    expect(result.metaData.auth).not.toHaveProperty('password');
    expect(result.metaData.auth).toHaveProperty('username');
  });

  it('removes token deeply nested', () => {
    const result = sanitizeApiResponse({
      a: { b: { c: { token: 'deeply-nested-secret', safe: 'value' } } },
    }) as any;
    expect(result.a.b.c).not.toHaveProperty('token');
    expect(result.a.b.c).toHaveProperty('safe');
  });

  it('removes api_key nested inside project object', () => {
    const result = sanitizeApiResponse({
      projects: [{ id: 'p1', api_key: 'secret', slug: 'my-project' }],
    }) as any;
    expect(result.projects[0]).not.toHaveProperty('api_key');
    expect(result.projects[0]).toHaveProperty('slug');
  });

  it('strips Authorization header from request.headers', () => {
    const result = sanitizeApiResponse({
      request: {
        url: '/api',
        headers: {
          authorization: 'Bearer token123',
          'content-type': 'application/json',
        },
      },
    }) as any;
    expect(result.request.headers).not.toHaveProperty('authorization');
    expect(result.request.headers).toHaveProperty('content-type');
  });

  it('strips Cookie header case-insensitively', () => {
    const result = sanitizeApiResponse({
      request: { headers: { cookie: 'session=abc', accept: 'application/json' } },
    }) as any;
    expect(result.request.headers).not.toHaveProperty('cookie');
    expect(result.request.headers).toHaveProperty('accept');
  });

  it('strips x-api-key header from request.headers', () => {
    const result = sanitizeApiResponse({
      request: { headers: { 'x-api-key': 'my-key', 'user-agent': 'Mozilla' } },
    }) as any;
    expect(result.request.headers).not.toHaveProperty('x-api-key');
    expect(result.request.headers).toHaveProperty('user-agent');
  });

  it('retains non-sensitive headers (content-type, user-agent)', () => {
    const result = sanitizeApiResponse({
      request: {
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
          accept: 'application/json',
        },
      },
    }) as any;
    expect(result.request.headers).toHaveProperty('content-type');
    expect(result.request.headers).toHaveProperty('user-agent');
    expect(result.request.headers).toHaveProperty('accept');
  });

  it('strips body from request object', () => {
    const result = sanitizeApiResponse({
      request: { url: '/login', method: 'POST', body: { password: 'secret' } },
    }) as any;
    expect(result.request).not.toHaveProperty('body');
    expect(result.request).toHaveProperty('url');
    expect(result.request).toHaveProperty('method');
  });

  it('recursively sanitizes items in arrays', () => {
    const result = sanitizeApiResponse([
      { id: '1', email: 'a@b.com' },
      { id: '2', email: 'c@d.com' },
    ]) as any;
    expect(result[0]).not.toHaveProperty('email');
    expect(result[0]).toHaveProperty('id');
    expect(result[1]).not.toHaveProperty('email');
  });

  it('handles arrays of primitives without modification', () => {
    const result = sanitizeApiResponse([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it('handles empty object', () => {
    expect(sanitizeApiResponse({})).toEqual({});
  });

  it('handles empty array', () => {
    expect(sanitizeApiResponse([])).toEqual([]);
  });

  it('handles object with only sensitive keys', () => {
    const result = sanitizeApiResponse({ email: 'x@y.com', password: 'abc' }) as any;
    expect(result).toEqual({});
  });
});
