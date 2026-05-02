import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { errorsFixture, errorDetailFixture } from '../../fixtures/errors';
import { eventsFixture } from '../../fixtures/events';

const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleListErrors, handleViewError, handleSearchIssues } =
  await import('../../../src/tools/errors');

describe('handleListErrors', () => {
  beforeEach(() => mockGet.mockReset());

  it('strips user.email from each item in array', async () => {
    mockGet.mockResolvedValue({
      data: [{ ...errorsFixture[0], user: { id: 'u1', email: 'leaked@example.com' } }],
    });
    const result = await handleListErrors({ project_id: 'proj_1' });
    expect(result.content[0].text).not.toContain('leaked@example.com');
  });

  it('strips assignee.email from each item', async () => {
    mockGet.mockResolvedValue({
      data: [{ ...errorsFixture[0], assignee: { id: 'u1', name: 'Dev', email: 'assignee@example.com' } }],
    });
    const result = await handleListErrors({ project_id: 'proj_1' });
    expect(result.content[0].text).not.toContain('assignee@example.com');
  });

  it('strips assignee.name from each item', async () => {
    mockGet.mockResolvedValue({
      data: [{ ...errorsFixture[0], assignee: { id: 'u1', name: 'Dev Person', email: 'dev@example.com' } }],
    });
    const result = await handleListErrors({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0].assignee).not.toHaveProperty('name');
  });

  it('retains non-PII fields: id, error_class, message, status, events_count', async () => {
    mockGet.mockResolvedValue({ data: errorsFixture });
    const result = await handleListErrors({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('id', 'error_12345');
    expect(parsed[0]).toHaveProperty('error_class', 'TypeError');
    expect(parsed[0]).toHaveProperty('status', 'open');
    expect(parsed[0]).toHaveProperty('events_count', 42);
  });

  it('passes through empty array', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const result = await handleListErrors({ project_id: 'proj_1' });
    expect(result.content[0].text).toBe('[]');
  });
});

describe('handleViewError', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: errorDetailFixture });
  });

  it('strips assignee.email', async () => {
    const result = await handleViewError({ error_id: 'error_12345' });
    expect(result.content[0].text).not.toContain('test@example.com');
  });

  it('strips assignee.name', async () => {
    const result = await handleViewError({ error_id: 'error_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.assignee).not.toHaveProperty('name');
  });

  it('retains assignee.id', async () => {
    const result = await handleViewError({ error_id: 'error_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.assignee).toHaveProperty('id', 'user_12345');
  });

  it('retains non-PII: id, error_class, events_count, status', async () => {
    const result = await handleViewError({ error_id: 'error_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('id', 'error_12345');
    expect(parsed).toHaveProperty('error_class', 'TypeError');
    expect(parsed).toHaveProperty('events_count', 42);
    expect(parsed).toHaveProperty('status', 'open');
  });
});

describe('handleSearchIssues', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: eventsFixture });
  });

  it('strips user.email from each item (hits events endpoint)', async () => {
    const result = await handleSearchIssues({ project_id: 'proj_1', query: 'TypeError' });
    const parsed = JSON.parse(result.content[0].text);
    parsed.forEach((item: Record<string, unknown>) => {
      if (item.user) {
        expect((item.user as Record<string, unknown>)).not.toHaveProperty('email');
      }
    });
  });

  it('strips request.headers.authorization when present', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 'e1', request: { headers: { authorization: 'Bearer tok' }, url: '/api' } }] });
    const result = await handleSearchIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0].request?.headers).not.toHaveProperty('authorization');
  });

  it('strips request.body when present', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 'e1', request: { url: '/api', body: { secret: 'pw' } } }] });
    const result = await handleSearchIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0].request).not.toHaveProperty('body');
  });

  it('retains non-PII event fields: id, app, device', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 'e1', app: { version: '1.0' }, device: { os: 'Linux' } }] });
    const result = await handleSearchIssues({ project_id: 'proj_1' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('id', 'e1');
    expect(parsed[0]).toHaveProperty('app');
    expect(parsed[0]).toHaveProperty('device');
  });
});
