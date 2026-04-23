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
});
