/**
 * Error resource handlers
 */

import { AxiosInstance } from 'axios';
import { ResourceHandler } from '../types/index.js';
import { sanitizeApiResponse, sanitizeUser } from '../utils/sanitize.js';

/**
 * Handle error resources
 */
export const handleErrorResource: ResourceHandler = async (uri, client) => {
  const errorMatch = uri.match(/^bugsnag:\/\/error\/(.+)$/);
  if (!errorMatch) {
    return null;
  }

  const errorId = errorMatch[1];
  const response = await client.get(`/errors/${errorId}`);

  const sanitized = sanitizeApiResponse(response.data) as Record<string, unknown>;
  if (sanitized.assignee) {
    sanitized.assignee = sanitizeUser(sanitized.assignee as Record<string, unknown>);
  }

  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(sanitized, null, 2),
  };
};
