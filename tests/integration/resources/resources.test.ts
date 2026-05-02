import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { organizationsFixture } from '../../fixtures/organizations';
import { projectsFixture } from '../../fixtures/projects';
import { errorDetailFixture } from '../../fixtures/errors';

const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleErrorResource } = await import('../../../src/resources/errors');
const { handleOrganizationResource } = await import('../../../src/resources/organizations');
const { handleProjectResource } = await import('../../../src/resources/projects');

describe('handleErrorResource', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: errorDetailFixture });
  });

  it('strips assignee.email', async () => {
    const result = await handleErrorResource('bugsnag://error/error_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.assignee).not.toHaveProperty('email');
  });

  it('strips assignee.name', async () => {
    const result = await handleErrorResource('bugsnag://error/error_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.assignee).not.toHaveProperty('name');
  });

  it('retains assignee.id', async () => {
    const result = await handleErrorResource('bugsnag://error/error_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.assignee).toHaveProperty('id', 'user_12345');
  });

  it('retains non-PII: id, error_class, events_count, status', async () => {
    const result = await handleErrorResource('bugsnag://error/error_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed).toHaveProperty('id', 'error_12345');
    expect(parsed).toHaveProperty('error_class', 'TypeError');
    expect(parsed).toHaveProperty('events_count', 42);
  });

  it('returns null for non-matching URI', async () => {
    const result = await handleErrorResource('bugsnag://notanerror/123', { get: mockGet } as any);
    expect(result).toBeNull();
  });
});

describe('handleOrganizationResource', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet
      .mockResolvedValueOnce({ data: organizationsFixture[0] })
      .mockResolvedValueOnce({ data: projectsFixture });
  });

  it('retains organization.id and organization.slug', async () => {
    const result = await handleOrganizationResource('bugsnag://organization/org_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.organization).toHaveProperty('id', 'org_12345');
    expect(parsed.organization).toHaveProperty('slug', 'test-org');
  });

  it('retains organization.name (not PII)', async () => {
    const result = await handleOrganizationResource('bugsnag://organization/org_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.organization).toHaveProperty('name', 'Test Organization');
  });

  it('retains projects[0].id and projects[0].slug', async () => {
    const result = await handleOrganizationResource('bugsnag://organization/org_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.projects[0]).toHaveProperty('id', 'project_12345');
    expect(parsed.projects[0]).toHaveProperty('slug', 'test-project');
  });

  it('strips projects[0].api_key', async () => {
    const result = await handleOrganizationResource('bugsnag://organization/org_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed.projects[0]).not.toHaveProperty('api_key');
  });

  it('returns null for non-matching URI', async () => {
    const result = await handleOrganizationResource('bugsnag://notanorg/123', { get: mockGet } as any);
    expect(result).toBeNull();
  });
});

describe('handleProjectResource', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: projectsFixture[0] });
  });

  it('retains id, slug, type', async () => {
    const result = await handleProjectResource('bugsnag://project/project_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed).toHaveProperty('id', 'project_12345');
    expect(parsed).toHaveProperty('slug', 'test-project');
    expect(parsed).toHaveProperty('type', 'nodejs');
  });

  it('retains name (not PII)', async () => {
    const result = await handleProjectResource('bugsnag://project/project_12345', { get: mockGet } as any);
    const parsed = JSON.parse(result!.text);
    expect(parsed).toHaveProperty('name', 'Test Project');
  });

  it('strips api_key', async () => {
    const result = await handleProjectResource('bugsnag://project/project_12345', { get: mockGet } as any);
    expect(result!.text).not.toContain('test-api-key');
  });

  it('returns null for non-matching URI', async () => {
    const result = await handleProjectResource('bugsnag://notaproject/123', { get: mockGet } as any);
    expect(result).toBeNull();
  });
});
