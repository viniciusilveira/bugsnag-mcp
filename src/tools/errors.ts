/**
 * Error-related tool handlers
 */

import { initApiClient } from '../api/client.js';
import { ToolHandler } from '../types/index.js';
import { sanitizeApiResponse, sanitizeUser } from '../utils/sanitize.js';

/**
 * Handle the list_errors tool
 */
export const handleListErrors: ToolHandler = async args => {
  const projectId = args.project_id;
  const status = args.status || 'open';
  const sort = args.sort || 'newest';
  const limit = args.limit || 10;

  const client = initApiClient();
  const response = await client.get(`/projects/${projectId}/errors`, {
    params: { status, sort, per_page: limit },
  });

  const sanitized = (sanitizeApiResponse(response.data) as Record<string, unknown>[]).map(item => {
    if (item.assignee) item.assignee = sanitizeUser(item.assignee as Record<string, unknown>);
    return item;
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(sanitized, null, 2),
      },
    ],
  };
};

/**
 * Handle the view_error tool
 */
export const handleViewError: ToolHandler = async args => {
  const errorId = args.error_id;

  const client = initApiClient();
  const response = await client.get(`/errors/${errorId}`);

  const sanitized = sanitizeApiResponse(response.data) as Record<string, unknown>;
  if (sanitized.assignee) {
    sanitized.assignee = sanitizeUser(sanitized.assignee as Record<string, unknown>);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(sanitized, null, 2),
      },
    ],
  };
};

/**
 * Handle the search_issues tool
 */
export const handleSearchIssues: ToolHandler = async args => {
  const projectId = args.project_id;
  const query = args.query || '';
  const errorClass = args.error_class;
  const appVersion = args.app_version;

  const params: any = { q: query };
  if (errorClass) params.error_class = errorClass;
  if (appVersion) params.app_version = appVersion;

  const client = initApiClient();
  const response = await client.get(`/projects/${projectId}/events`, { params });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(sanitizeApiResponse(response.data), null, 2),
      },
    ],
  };
};
