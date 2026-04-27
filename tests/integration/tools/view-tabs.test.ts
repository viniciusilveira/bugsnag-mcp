/**
 * Integration tests for the view_tabs tool
 */

// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { eventDetailFixture } from '../../fixtures/events';

const mockGet = jest.fn();

jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleViewTabs } = await import('../../../src/tools/events');

describe('View Tabs Tool', () => {
  it('should have view_tabs handler function', () => {
    expect(typeof handleViewTabs).toBe('function');
  });
});

describe('handleViewTabs — request object header and body filtering', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: eventDetailFixture });
  });

  it('strips Authorization header from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).not.toHaveProperty('authorization');
    expect(parsed.request?.headers).not.toHaveProperty('Authorization');
  });

  it('strips Cookie header from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).not.toHaveProperty('cookie');
    expect(parsed.request?.headers).not.toHaveProperty('Cookie');
  });

  it('strips X-Api-Key header from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).not.toHaveProperty('x-api-key');
  });

  it('strips body from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).not.toHaveProperty('body');
  });

  it('strips clientIp from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).not.toHaveProperty('clientIp');
  });

  it('retains safe headers like content-type and user-agent', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).toHaveProperty('content-type');
    expect(parsed.request?.headers).toHaveProperty('user-agent');
  });

  it('retains url and method from request', async () => {
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).toHaveProperty('url');
    expect(parsed.request).toHaveProperty('method');
  });

  it('returns null request when event has no request context', async () => {
    mockGet.mockResolvedValue({ data: { ...eventDetailFixture, request: null } });
    const result = await handleViewTabs({ project_id: 'proj_1', event_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).toBeNull();
  });
});
