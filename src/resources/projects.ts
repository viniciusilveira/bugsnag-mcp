/**
 * Project resource handlers
 */

import { AxiosInstance } from 'axios';
import { ResourceHandler } from '../types/index.js';
import { sanitizeApiResponse } from '../utils/sanitize.js';

/**
 * Handle project resources
 */
export const handleProjectResource: ResourceHandler = async (uri, client) => {
  const projectMatch = uri.match(/^bugsnag:\/\/project\/(.+)$/);
  if (!projectMatch) {
    return null;
  }

  const projectId = projectMatch[1];
  const response = await client.get(`/projects/${projectId}`);

  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(sanitizeApiResponse(response.data), null, 2),
  };
};
