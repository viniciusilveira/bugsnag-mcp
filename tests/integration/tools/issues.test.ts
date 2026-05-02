import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { eventsFixture, eventDetailFixture } from '../../fixtures/events';

const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleListIssues, handleViewIssue } = await import('../../../src/tools/issues');

describe('handleListIssues', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: eventsFixture });
  });

  it('strips user.email from each item', async () => {
    const result = await handleListIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    parsed.forEach((item: Record<string, unknown>) => {
      if (item.user) {
        expect((item.user as Record<string, unknown>)).not.toHaveProperty('email');
      }
    });
  });

  it('strips user.name from each item', async () => {
    const result = await handleListIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    parsed.forEach((item: Record<string, unknown>) => {
      if (item.user) {
        expect((item.user as Record<string, unknown>)).not.toHaveProperty('name');
      }
    });
  });

  it('retains user.id in each item', async () => {
    const result = await handleListIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0].user).toHaveProperty('id', 'user_123');
    expect(parsed[1].user).toHaveProperty('id', 'user_456');
  });

  it('retains non-PII fields: id, app, device', async () => {
    const result = await handleListIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('id');
    expect(parsed[0]).toHaveProperty('app');
    expect(parsed[0]).toHaveProperty('device');
  });
});

describe('handleViewIssue', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: eventDetailFixture });
  });

  it('strips user.email', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.user).not.toHaveProperty('email');
  });

  it('strips request.headers.authorization', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).not.toHaveProperty('authorization');
  });

  it('strips request.headers.cookie', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request?.headers).not.toHaveProperty('cookie');
  });

  it('strips request.body', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).not.toHaveProperty('body');
  });

  it('strips request.clientIp', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.request).not.toHaveProperty('clientIp');
  });

  it('retains id, app, device', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('id', 'event_12345');
    expect(parsed).toHaveProperty('app');
    expect(parsed).toHaveProperty('device');
  });

  it('retains exceptions, breadcrumbs, metaData', async () => {
    const result = await handleViewIssue({ issue_id: 'event_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('exceptions');
    expect(parsed).toHaveProperty('breadcrumbs');
    expect(parsed).toHaveProperty('metaData');
  });
});
