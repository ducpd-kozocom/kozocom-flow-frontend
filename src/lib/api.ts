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
  return 'http://localhost:8000/api';
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
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }

  return data.data;
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
  getAll: (params?: { developer?: string; period?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<CodeReview[]>(`/reviews${query ? `?${query}` : ''}`);
  },
  
  ingest: (review: Partial<CodeReview>) => 
    fetchApi<{ id: number }>('/reviews/ingest', {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  
  getStats: (period?: string) => 
    fetchApi<ReviewStats>(`/reviews/stats${period ? `?period=${period}` : ''}`),
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
  chat: chatApi,
  dashboard: dashboardApi,
};
