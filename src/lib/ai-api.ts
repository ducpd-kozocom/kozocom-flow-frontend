// ============================================================
// ai-api.ts
// API client for AI/CV service (port 9090)
// ============================================================

import axios from 'axios';

const AI_URL = import.meta.env?.VITE_AI_URL ?? 'http://localhost:9090/api/v1';

export const aiClient = axios.create({
  baseURL: AI_URL,
  headers: { 'Content-Type': 'application/json' },
});

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

export interface FilteredCandidate extends Omit<Candidate, 'match_score' | 'hr_score' | 'hr_score_breakdown' | 'vector_id' | 'created_at'> {
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

export interface FilterResponse {
  job_title: string;
  total_candidates: number;
  filtered_count: number;
  min_score_applied: number;
  candidates: FilteredCandidate[];
}

// ─────────────────────────────────────────────────────────────
// CV API
// ─────────────────────────────────────────────────────────────
export const cvApi = {
  upload: async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return aiClient.post('/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  ask: (question: string, topK = 5) =>
    aiClient.post<{ question: string; candidates: AskResult[]; total: number }>('/cv/ask', { question, top_k: topK }).then(r => r.data),

  getCandidates: (skip = 0, limit = 20) =>
    aiClient.get<{ candidates: Candidate[]; total: number }>('/cv/candidates', { params: { skip, limit } }).then(r => r.data),

  getById: (id: number) => aiClient.get<Candidate>(`/cv/candidates/${id}`).then(r => r.data),

  filter: (jobId: number, minScore = 0, topK = 50) =>
    aiClient.post<FilterResponse>('/cv/filter', { job_id: jobId, min_score: minScore, top_k: topK, include_explanations: true }).then(r => r.data),

  exportCsv: (jobId: number, minScore = 0) =>
    aiClient.get<Blob>(`/cv/filter/csv`, { params: { job_id: jobId, min_score: minScore }, responseType: 'blob' }).then(r => r.data),
};

// ─────────────────────────────────────────────────────────────
// JOBS API
// ─────────────────────────────────────────────────────────────
export const jobsApi = {
  getAll: (activeOnly = true) => aiClient.get<JobDescription[]>('/jobs', { params: { active_only: activeOnly } }).then(r => r.data),
  getById: (id: number) => aiClient.get<JobDescription>(`/jobs/${id}`).then(r => r.data),
  create: (job: Omit<JobDescription, 'id' | 'created_at' | 'is_active'>) => aiClient.post<JobDescription>('/jobs', job).then(r => r.data),
  update: (id: number, job: Partial<JobDescription>) => aiClient.put<JobDescription>(`/jobs/${id}`, job).then(r => r.data),
  delete: (id: number) => aiClient.delete(`/jobs/${id}`),
};

// ─────────────────────────────────────────────────────────────
// CHAT API
// ─────────────────────────────────────────────────────────────
export const chatApi = {
  query: (message: string, conversationId?: string) =>
    aiClient.post<{ message: string; data?: unknown; sources?: string[] }>('/chat/query', { message, conversation_id: conversationId }).then(r => r.data),
};

export default { cv: cvApi, jobs: jobsApi, chat: chatApi };
