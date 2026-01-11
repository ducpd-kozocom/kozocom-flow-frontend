// ============================================================
// api.ts
// Description: API client for communicating with backend
// ============================================================

// API Base URL - works with both Vite (import.meta.env) and Bun (process.env)
const getApiBaseUrl = () => {
  try {
    // Try Vite environment variable first
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
  } catch {
    // Ignore if import.meta is not supported
  }
  // Fallback to default localhost
  return 'http://localhost:9000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export interface Candidate {
  id: number;
  name: string;
  email: string;
  current_role: string;
  years_experience: number;
  skills: string[];
  match_score: number;
  created_at: string;
}

export interface Repository {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  installation_id: number;
  is_active: boolean;
  connected_at: string | null;
  last_review_at: string | null;
}

export interface RepoConfig {
  id: number;
  repository_id: number;
  enabled: boolean;
  auto_review: boolean;
  review_drafts: boolean;
  min_severity: string;
  include_patterns: string[];
  exclude_patterns: string[];
  slack_channel: string | null;
  notify_on: string;
}

export interface AffectedCaller {
  id: number;
  file_path: string;
  line_number: number | null;
  call_text: string | null;
  break_reason: string | null;
}

export interface BreakingChange {
  id: number;
  file_path: string;
  line_number: number | null;
  entity_type: string | null;
  entity_name: string | null;
  class_name: string | null;
  change_type: string | null;
  change_detail: string | null;
  old_definition: string | null;
  new_definition: string | null;
  severity: string;
  affected_count: number;
  recommendation: string | null;
  affected_callers: AffectedCaller[];
}

export interface ReviewComment {
  id: number;
  file_path: string;
  line_number: number | null;
  severity: string | null;
  message: string | null;
  recommendation: string | null;
  affected_files: { path: string; line: number; reason: string }[] | null;
  github_comment_id: number | null;
  published_at: string | null;
}

export interface PRReview {
  id: number;
  repository_id: number;
  pr_number: number;
  pr_title: string | null;
  pr_author: string | null;
  pr_link: string;
  base_branch: string | null;
  head_branch: string | null;
  status: string;
  skip_reason: string | null;
  total_files: number;
  total_changes: number;
  total_comments: number;
  count_critical: number;
  count_warning: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  breaking_changes?: BreakingChange[];
  comments?: ReviewComment[];
}

export interface CodeReview {
  id: number;
  developer_name: string;
  pr_link: string;
  review_date: string;
  total_errors: number;
  error_types: { syntax: number; logic: number; security: number };
}

export interface DeveloperStat {
  name: string;
  errors: number;
  color: string;
}

export interface ReviewStats {
  totalReviews: number;
  totalErrors: number;
  avgErrorsPerReview: number;
  securityIssues: number;
  developerStats: DeveloperStat[];
  errorTypes: { syntax: number; logic: number; security: number };
  weeklyTrend: { week: string; errors: number }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// ─────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Handle both wrapped { success, data } and raw response formats
  if (typeof data === 'object' && 'success' in data) {
    if (!data.success) throw new Error(data.error || 'Unknown error');
    return data.data;
  }
  
  return data as T;
}

// ─────────────────────────────────────────────────────────────
// CANDIDATES API
// ─────────────────────────────────────────────────────────────
export const candidatesApi = {
  getAll: (search?: string) => 
    fetchApi<Candidate[]>(`/candidates${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  
  getById: (id: number) => 
    fetchApi<Candidate>(`/candidates/${id}`),
  
  create: (candidate: Partial<Candidate>) => 
    fetchApi<{ id: number }>('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidate),
    }),
  
  update: (id: number, candidate: Partial<Candidate>) => 
    fetchApi<void>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(candidate),
    }),
  
  delete: (id: number) => 
    fetchApi<void>(`/candidates/${id}`, { method: 'DELETE' }),
  
  getStats: () => 
    fetchApi<{ total: number; newThisWeek: number; avgMatchScore: number }>('/candidates/stats/overview'),
};

// ─────────────────────────────────────────────────────────────
// REVIEWS API
// ─────────────────────────────────────────────────────────────
export const reviewsApi = {
  getAll: (params?: { repository_id?: number; period?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<PRReview[]>(`/reviews${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => fetchApi<PRReview>(`/reviews/${id}`),

  getStats: (period?: string) =>
    fetchApi<ReviewStats>(`/reviews/stats${period ? `?period=${period}` : ''}`),
};

// ─────────────────────────────────────────────────────────────
// REPOSITORIES API
// ─────────────────────────────────────────────────────────────
export const repositoriesApi = {
  getAll: () => fetchApi<Repository[]>('/repositories'),

  getById: (id: number) => fetchApi<Repository>(`/repositories/${id}`),

  getConfig: (id: number) => fetchApi<RepoConfig>(`/repositories/${id}/config`),

  saveConfig: (id: number, config: Partial<RepoConfig>) =>
    fetchApi<RepoConfig>(`/repositories/${id}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

// ─────────────────────────────────────────────────────────────
// CHAT API
// ─────────────────────────────────────────────────────────────
export const chatApi = {
  query: async (message: string, sessionId?: string): Promise<{ message: string; timestamp: string }> => {
    return fetchApi('/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  },
  
  getHistory: (sessionId: string) => 
    fetchApi<ChatMessage[]>(`/chat/history?sessionId=${sessionId}`),
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD API
// ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getOverview: async () => {
    const [candidateStats, reviewStats] = await Promise.all([
      candidatesApi.getStats().catch(() => ({ total: 0, newThisWeek: 0, avgMatchScore: 0 })),
      reviewsApi.getStats('month').catch(() => ({
        totalReviews: 0,
        totalErrors: 0,
        avgErrorsPerReview: 0,
        securityIssues: 0,
        developerStats: [],
        errorTypes: { syntax: 0, logic: 0, security: 0 },
        weeklyTrend: []
      })),
    ]);

    return {
      candidates: candidateStats,
      reviews: reviewStats,
    };
  },
};

export default {
  candidates: candidatesApi,
  reviews: reviewsApi,
  repositories: repositoriesApi,
  chat: chatApi,
  dashboard: dashboardApi,
};
