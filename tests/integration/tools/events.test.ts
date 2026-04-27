/**
 * Integration tests for event tools
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { eventsFixture, eventDetailFixture } from '../../fixtures/events';

// ESM-compatible mock: must be set up before dynamic imports
const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const {
  handleListErrorEvents,
  handleViewLatestEvent,
  handleViewEvent,
  handleViewStacktrace,
  handleViewExceptionChain,
} = await import('../../../src/tools/events');

describe('Event Tools', () => {
  it('should have event handler functions', () => {
    expect(typeof handleListErrorEvents).toBe('function');
    expect(typeof handleViewLatestEvent).toBe('function');
    expect(typeof handleViewEvent).toBe('function');
    expect(typeof handleViewStacktrace).toBe('function');
    expect(typeof handleViewExceptionChain).toBe('function');
  });

  describe('handleViewLatestEvent — PII filtering', () => {
    beforeEach(() => {
      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: eventDetailFixture });
    });

    it('does not expose email in user field', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('email');
    });

    it('does not expose name in user field', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('name');
    });

    it('does not expose ip_address in user field', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('ip_address');
    });

    it('retains user id for debugging context', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toHaveProperty('id', 'user_123');
    });

    it('returns null user when event has no user context', async () => {
      const fixtureWithNoUser = { ...eventDetailFixture, user: null };
      mockGet.mockResolvedValue({ data: fixtureWithNoUser });

      const result = await handleViewLatestEvent({ error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toBeNull();
    });
  });

  describe('handleViewLatestEvent — full details mode PII filtering', () => {
    beforeEach(() => {
      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: eventDetailFixture });
    });

    it('strips authorization header from request in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.headers).not.toHaveProperty('authorization');
    });

    it('strips cookie header from request in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.headers).not.toHaveProperty('cookie');
    });

    it('strips x-api-key header from request in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.headers).not.toHaveProperty('x-api-key');
    });

    it('strips body from request in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request).not.toHaveProperty('body');
    });

    it('strips clientIp from request in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request).not.toHaveProperty('clientIp');
    });

    it('retains safe headers in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.headers).toHaveProperty('content-type');
      expect(parsed.request?.headers).toHaveProperty('user-agent');
    });

    it('strips email from user in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('email');
    });

    it('retains user id in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toHaveProperty('id', 'user_123');
    });

    it('preserves non-PII top-level fields in full details mode', async () => {
      const result = await handleViewLatestEvent({ error_id: 'error_12345', include_full_details: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe('event_12345');
      expect(parsed.app).toBeDefined();
      expect(parsed.device).toBeDefined();
      expect(parsed.exceptions).toBeDefined();
      expect(parsed.breadcrumbs).toBeDefined();
      expect(parsed.metaData).toBeDefined();
    });
  });

  describe('handleViewEvent — PII filtering', () => {
    beforeEach(() => {
      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: eventDetailFixture });
    });

    it('strips authorization header from request', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.headers).not.toHaveProperty('authorization');
    });

    it('strips body from request', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request).not.toHaveProperty('body');
    });

    it('strips clientIp from request', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request).not.toHaveProperty('clientIp');
    });

    it('strips email from user', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('email');
    });

    it('retains user id', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toHaveProperty('id', 'user_123');
    });

    it('retains url and method from request', async () => {
      const result = await handleViewEvent({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.request?.url).toBe('https://api.example.com/users/123/profile');
      expect(parsed.request?.method).toBe('POST');
    });
  });

  describe('handleListErrorEvents — PII filtering', () => {
    beforeEach(() => {
      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: eventsFixture });
    });

    it('strips email from user in all list items', async () => {
      const result = await handleListErrorEvents({ project_id: 'proj_1', error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      parsed.forEach((item: Record<string, unknown>) => {
        expect((item.user as Record<string, unknown>)).not.toHaveProperty('email');
      });
    });

    it('strips name from user in all list items', async () => {
      const result = await handleListErrorEvents({ project_id: 'proj_1', error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      parsed.forEach((item: Record<string, unknown>) => {
        expect((item.user as Record<string, unknown>)).not.toHaveProperty('name');
      });
    });

    it('retains user id in all list items', async () => {
      const result = await handleListErrorEvents({ project_id: 'proj_1', error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed[0].user).toHaveProperty('id', 'user_123');
      expect(parsed[1].user).toHaveProperty('id', 'user_456');
    });

    it('returns correct number of events', async () => {
      const result = await handleListErrorEvents({ project_id: 'proj_1', error_id: 'error_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(eventsFixture.length);
    });
  });
});
