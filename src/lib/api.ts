// ============================================================
// api.ts
// Description: API client for communicating with backend
// ============================================================

// API Base URL - works with both Vite (import.meta.env) and Bun (process.env)
const getApiBaseUrl = () => {
  try {
    // Try Vite environment variable first
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      console.log(import.meta.env.VITE_API_BASE_URL);
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
export interface SkillDetail {
  id: number;
  category: string;
  name: string;
  proficiency: string | null;
}

export interface Experience {
  id: number;
  company: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_months: number | null;
  technologies: string[];
  achievements: string[];
}

export interface Education {
  id: number;
  degree: string | null;
  field: string | null;
  institution: string | null;
  graduation_year: number | null;
}

export interface Project {
  id: number;
  name: string | null;
  description: string | null;
  technologies: string[];
  role: string | null;
  outcome: string | null;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string | null;
  year: number | null;
}

export interface RedFlag {
  id: number;
  type: string;
  severity: string;
  evidence: string | null;
}

export interface Candidate {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_role: string | null;
  years_experience: number | null;
  seniority_level: string | null;
  summary: string | null;
  social_links: { linkedin?: string; github?: string; portfolio?: string; other?: string[] } | null;
  spoken_languages: string[] | null;
  availability: string | null;
  risk_summary: string | null;
  skills: string[];
  skill_details?: SkillDetail[];
  experiences?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
  red_flags?: RedFlag[];
  match_score: number | null;
  hr_score: number | null;
  hr_score_breakdown: Record<string, unknown> | null;
  vector_id: string | null;
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

// AI Service Base URL (separate from main backend)
const AI_BASE_URL = 'http://localhost:9090/api/v1';

// ─────────────────────────────────────────────────────────────
// CV API (AI Service)
// ─────────────────────────────────────────────────────────────
export interface UploadResult {
  filename: string;
  success: boolean;
  candidate_id: number | null;
  error: string | null;
}

export interface UploadResponse {
  uploaded: number;
  failed: number;
  results: UploadResult[];
}

export interface AskResult {
  id: number;
  name: string;
  score: number;
  current_role: string | null;
  skills: string[];
  summary: string | null;
}

export interface AskResponse {
  question: string;
  candidates: AskResult[];
  total: number;
}

// Job Description types
export interface JobDescription {
  id: number;
  title: string;
  description?: string;
  department?: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  min_years_experience?: number;
  max_years_experience?: number;
  location?: string;
  remote_allowed: boolean;
  is_active: boolean;
  created_at?: string;
}

// Filter/Score types
export interface ScoreBreakdown {
  skill_match_score: number;
  experience_score: number;
  role_similarity_score: number;
  stability_score: number;
  red_flag_penalty: number;
  final_score: number;
  matched_required_skills: string[];
  matched_nice_to_have_skills: string[];
  missing_required_skills: string[];
  red_flags: { type: string; description: string; penalty: number }[];
}

export interface FilteredCandidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  current_role?: string;
  years_experience?: number;
  seniority_level?: string;
  summary?: string;
  social_links?: { linkedin?: string; github?: string; portfolio?: string; other?: string[] };
  availability?: string;
  skills: string[];
  skill_details?: SkillDetail[];
  experiences?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
  red_flags?: RedFlag[];
  final_score: number;
  recommendation: string;
  score_breakdown: ScoreBreakdown;
  explanation?: {
    candidate_name: string;
    job_title: string;
    recommendation: string;
    summary: string;
    strengths: string[];
    concerns: string[];
  };
}

export interface FilterResponse {
  job_title: string;
  total_candidates: number;
  filtered_count: number;
  min_score_applied: number;
  candidates: FilteredCandidate[];
}

export const cvApi = {
  /**
   * Upload multiple CV PDF files
   */
  upload: async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`${AI_BASE_URL}/cv/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Ask AI questions about candidates (semantic search)
   */
  ask: async (question: string, topK: number = 5): Promise<AskResponse> => {
    const response = await fetch(`${AI_BASE_URL}/cv/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, top_k: topK }),
    });
    
    if (!response.ok) {
      throw new Error(`Ask failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get all candidates with pagination
   */
  getCandidates: async (skip = 0, limit = 20): Promise<{ candidates: Candidate[]; total: number }> => {
    const response = await fetch(`${AI_BASE_URL}/cv/candidates?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to get candidates: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Get single candidate by ID with full details
   */
  getById: async (candidateId: number): Promise<Candidate> => {
    const response = await fetch(`${AI_BASE_URL}/cv/candidates/${candidateId}`);
    if (!response.ok) {
      throw new Error(`Failed to get candidate: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Filter and score candidates against a job description
   */
  filter: async (jobId: number, minScore = 0, topK = 50): Promise<FilterResponse> => {
    const response = await fetch(`${AI_BASE_URL}/cv/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        job_id: jobId, 
        min_score: minScore, 
        top_k: topK,
        include_explanations: true 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Filter failed: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Export filtered candidates as CSV
   */
  exportCsv: async (jobId: number, minScore = 0): Promise<Blob> => {
    const response = await fetch(
      `${AI_BASE_URL}/cv/filter/csv?job_id=${jobId}&min_score=${minScore}`
    );
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    return response.blob();
  },
};

// ─────────────────────────────────────────────────────────────
// JOBS API
// ─────────────────────────────────────────────────────────────
export const jobsApi = {
  /**
   * Get all jobs
   */
  getAll: async (activeOnly = true): Promise<JobDescription[]> => {
    const response = await fetch(`${AI_BASE_URL}/jobs?active_only=${activeOnly}`);
    if (!response.ok) {
      throw new Error(`Failed to get jobs: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Get job by ID
   */
  getById: async (id: number): Promise<JobDescription> => {
    const response = await fetch(`${AI_BASE_URL}/jobs/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get job: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Create new job
   */
  create: async (job: Omit<JobDescription, 'id' | 'created_at' | 'is_active'>): Promise<JobDescription> => {
    const response = await fetch(`${AI_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Update job
   */
  update: async (id: number, job: Partial<JobDescription>): Promise<JobDescription> => {
    const response = await fetch(`${AI_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update job: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Delete job
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${AI_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete job: ${response.status}`);
    }
  },
};

// ─────────────────────────────────────────────────────────────
// SMART CHAT API (with MCP/DB access)
// ─────────────────────────────────────────────────────────────
export interface SmartChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: unknown; // Optional structured data (tables, charts)
  timestamp: string;
}

export interface SmartChatResponse {
  message: string;
  data?: unknown;
  sources?: string[];
}

export const smartChatApi = {
  /**
   * Send message to smart assistant
   */
  query: async (message: string, conversationId?: string): Promise<SmartChatResponse> => {
    const response = await fetch(`${AI_BASE_URL}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
    
    if (!response.ok) {
      throw new Error(`Chat failed: ${response.status}`);
    }
    
    return response.json();
  },
};

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
  cv: cvApi,
  jobs: jobsApi,
  smartChat: smartChatApi,
};

