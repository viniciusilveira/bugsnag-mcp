// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { eventDetailFixture } from '../../fixtures/events';

// ESM-compatible mock: must be set up before dynamic imports
const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleViewTabs } = await import('../../../src/tools/events');

describe('View Tabs Tool', () => {
  it('should have view_tabs handler function', () => {
    expect(typeof handleViewTabs).toBe('function');
  });

  describe('handleViewTabs — PII filtering on user field', () => {
    beforeEach(() => {
      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: eventDetailFixture });
    });

    it('does not expose email in user field', async () => {
      const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('email');
    });

    it('does not expose name in user field', async () => {
      const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).not.toHaveProperty('name');
    });

    it('retains user id for debugging context', async () => {
      const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toHaveProperty('id', 'user_123');
    });

    it('returns null user when event has no user context', async () => {
      mockGet.mockResolvedValue({ data: { ...eventDetailFixture, user: null } });
      const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.user).toBeNull();
    });
  });
});
