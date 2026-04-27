import { sanitizeRequest, sanitizeUser, sanitizeEvent } from '../../../src/utils/sanitize';
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
