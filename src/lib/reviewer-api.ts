// ============================================================
// reviewer-api.ts
// API client for Code Reviewer service (port 9000)
// ============================================================

import axios from 'axios';

const REVIEWER_URL = import.meta.env?.VITE_REVIEWER_URL ?? 'http://localhost:8000/api/v1';

export const reviewerClient = axios.create({
  baseURL: REVIEWER_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
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
  review_on_update: boolean;
  include_patterns: string[];
  exclude_patterns: string[];
  slack_channel: string | null;
  slack_notify_on: string;
  github_comment: boolean;
  output_language: string;
  agents: Record<string, boolean>;
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

// ─────────────────────────────────────────────────────────────
// REPOSITORIES API
// ─────────────────────────────────────────────────────────────
export const repositoriesApi = {
  getAll: () => reviewerClient.get<Repository[]>('/repositories').then(r => r.data),
  getById: (id: number) => reviewerClient.get<Repository>(`/repositories/${id}`).then(r => r.data),
  getConfig: (id: number) => reviewerClient.get<RepoConfig>(`/repositories/${id}/config`).then(r => r.data),
  saveConfig: (id: number, config: Partial<RepoConfig>) => 
    reviewerClient.post<RepoConfig>(`/repositories/${id}/config`, config).then(r => r.data),
};

// ─────────────────────────────────────────────────────────────
// REVIEWS API
// ─────────────────────────────────────────────────────────────
export const reviewsApi = {
  getAll: (params?: { repository_id?: number; period?: string }) => 
    reviewerClient.get<PRReview[]>('/reviews', { params }).then(r => r.data),
  getById: (id: number) => reviewerClient.get<PRReview>(`/reviews/${id}`).then(r => r.data),
  getStats: (period?: string) => 
    reviewerClient.get<ReviewStats>('/reviews/stats', { params: { period } }).then(r => r.data),
};

export default { repositories: repositoriesApi, reviews: reviewsApi };
