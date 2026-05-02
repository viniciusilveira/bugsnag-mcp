import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { projectsFixture } from '../../fixtures/projects';

const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleListProjects } = await import('../../../src/tools/projects');

describe('handleListProjects', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: projectsFixture });
  });

  it('strips api_key from each project', async () => {
    const result = await handleListProjects({ organization_id: 'org_12345' });
    expect(result.content[0].text).not.toContain('test-api-key');
    expect(result.content[0].text).not.toContain('another-api-key');
  });

  it('retains name (project name is not PII)', async () => {
    const result = await handleListProjects({ organization_id: 'org_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('name', 'Test Project');
  });

  it('retains id, slug, type, organization_id', async () => {
    const result = await handleListProjects({ organization_id: 'org_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('id', 'project_12345');
    expect(parsed[0]).toHaveProperty('slug', 'test-project');
    expect(parsed[0]).toHaveProperty('type', 'nodejs');
    expect(parsed[0]).toHaveProperty('organization_id', 'org_12345');
  });

  it('sanitizes all items in the array', async () => {
    const result = await handleListProjects({ organization_id: 'org_12345' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(2);
    parsed.forEach((p: Record<string, unknown>) => {
      expect(p).not.toHaveProperty('api_key');
    });
  });
});
