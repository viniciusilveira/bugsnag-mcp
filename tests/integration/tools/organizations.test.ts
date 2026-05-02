import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { organizationsFixture } from '../../fixtures/organizations';

const mockGet = jest.fn();
jest.unstable_mockModule('../../../src/api/client', () => ({
  initApiClient: jest.fn(() => ({ get: mockGet })),
}));

const { handleListOrganizations } = await import('../../../src/tools/organizations');

describe('handleListOrganizations', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: organizationsFixture });
  });

  it('retains name (org name is not PII)', async () => {
    const result = await handleListOrganizations({});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('name', 'Test Organization');
  });

  it('retains id and slug', async () => {
    const result = await handleListOrganizations({});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed[0]).toHaveProperty('id', 'org_12345');
    expect(parsed[0]).toHaveProperty('slug', 'test-org');
  });

  it('passes through empty array', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const result = await handleListOrganizations({});
    expect(result.content[0].text).toBe('[]');
  });
});
