// ============================================================
// Candidates Module - Enhanced Page Component
// ============================================================

import { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cvApi, jobsApi } from '@/lib/api';
import type { Candidate, AskResult, FilteredCandidate, JobDescription } from '@/lib/api';
import { JobsModal } from './JobsModal';

// ─────────────────────────────────────────────────────────────
// AVATAR COLORS
// ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #06b6d4, #22d3ee)',
];

// ─────────────────────────────────────────────────────────────
// RECOMMENDATION COLORS
// ─────────────────────────────────────────────────────────────
const RECOMMENDATION_COLORS: Record<string, string> = {
  'Strong Match': '#10b981',
  'Good Fit': '#6366f1',
  'Potential': '#f59e0b',
  'Not Recommended': '#ef4444',
};

// ─────────────────────────────────────────────────────────────
// CANDIDATE CARD COMPONENT
// ─────────────────────────────────────────────────────────────
interface CandidateCardProps {
  candidate: Candidate | AskResult | FilteredCandidate;
  colorIndex: number;
  isScored?: boolean;
  onViewProfile?: (candidate: Candidate | AskResult | FilteredCandidate) => void;
}

const CandidateCard = memo(function CandidateCard({ candidate, colorIndex, isScored, onViewProfile }: CandidateCardProps) {
  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  
  // Handle different score types
  let matchScore = 0;
  let recommendation = '';
  let scoreBreakdown = null;
  
  if ('final_score' in candidate) {
    // FilteredCandidate (scored)
    matchScore = Math.round(candidate.final_score);
    recommendation = candidate.recommendation;
    scoreBreakdown = candidate.score_breakdown;
  } else if ('score' in candidate) {
    // AskResult
    matchScore = Math.round(candidate.score * 100);
  } else if ('match_score' in candidate) {
    // Regular Candidate
    matchScore = candidate.match_score || 0;
  }
  
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="candidate-card">
      <CardContent className="candidate-card-content">
        <div className="candidate-header">
          <div 
            className="candidate-avatar" 
            style={{ background: AVATAR_COLORS[colorIndex % AVATAR_COLORS.length] }}
          >
            {initials}
          </div>
          <div className="candidate-info">
            <h3 className="candidate-name">{candidate.name}</h3>
            <p className="candidate-role">{candidate.current_role || 'Not specified'}</p>
            {'years_experience' in candidate && (
              <p className="candidate-experience">
                {candidate.years_experience ? `${candidate.years_experience} years experience` : 'Experience not specified'}
              </p>
            )}
          </div>
          <div className="candidate-score">
            <div 
              className="score-circle" 
              style={{ 
                background: recommendation 
                  ? RECOMMENDATION_COLORS[recommendation] || AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
                  : AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
              }}
            >
              <span className="score-value">{matchScore}%</span>
            </div>
            <span className="score-label">
              {recommendation || 'Match'}
            </span>
          </div>
        </div>
        
        <div className="candidate-skills">
          {skills.map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>

        {isScored && scoreBreakdown && (
          <div style={{ marginTop: '12px' }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              style={{ width: '100%', marginBottom: showDetails ? '8px' : 0 }}
            >
              {showDetails ? '▲ Hide Score Details' : '▼ Show Score Details'}
            </Button>
            
            {showDetails && (
              <div style={{ 
                padding: '12px', 
                background: 'var(--kz-bg-secondary)', 
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>📊 Skill Match: <strong>{scoreBreakdown.skill_match_score.toFixed(0)}%</strong></div>
                  <div>📈 Experience: <strong>{scoreBreakdown.experience_score.toFixed(0)}%</strong></div>
                  <div>🎯 Role Match: <strong>{scoreBreakdown.role_similarity_score.toFixed(0)}%</strong></div>
                  <div>⚖️ Stability: <strong>{scoreBreakdown.stability_score.toFixed(0)}%</strong></div>
                </div>
                
                {scoreBreakdown.matched_required_skills.length > 0 && (
                  <div style={{ marginBottom: '6px', color: '#10b981' }}>
                    ✓ Matched: {scoreBreakdown.matched_required_skills.join(', ')}
                  </div>
                )}
                
                {scoreBreakdown.missing_required_skills.length > 0 && (
                  <div style={{ marginBottom: '6px', color: '#f59e0b' }}>
                    ✗ Missing: {scoreBreakdown.missing_required_skills.join(', ')}
                  </div>
                )}
                
                {scoreBreakdown.red_flags.length > 0 && (
                  <div style={{ color: '#ef4444' }}>
                    ⚠️ Red Flags: {scoreBreakdown.red_flags.map(rf => rf.description).join('; ')}
                    <span style={{ marginLeft: '8px' }}>(-{scoreBreakdown.red_flag_penalty} pts)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="candidate-actions">
          <Button variant="default" size="sm" onClick={() => onViewProfile?.(candidate)}>
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// PAGINATION COMPONENT
// ─────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '16px 0',
      borderTop: '1px solid var(--kz-border)',
      marginTop: '16px'
    }}>
      <span style={{ color: 'var(--kz-text-muted)', fontSize: '0.9rem' }}>
        Showing {startItem}-{endItem} of {totalItems} candidates
      </span>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Prev
        </Button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              style={{ minWidth: '40px' }}
            >
              {pageNum}
            </Button>
          );
        })}
        
        <Button 
          variant="outline" 
          size="sm" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// SORT OPTIONS
// ─────────────────────────────────────────────────────────────
type SortOption = 'name' | 'date' | 'experience' | 'score';

// ─────────────────────────────────────────────────────────────
// CANDIDATES PAGE
// ─────────────────────────────────────────────────────────────
export const CandidatesPage = memo(function CandidatesPage() {
  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scoredCandidates, setScoredCandidates] = useState<FilteredCandidate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | AskResult | FilteredCandidate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [scoring, setScoring] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const pageSize = 20;
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('date');
  
  // Stats
  const [stats, setStats] = useState({ total: 0, newThisWeek: 0, avgMatchScore: 0 });

  const fetchCandidates = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pageSize;
      const data = await cvApi.getCandidates(skip, pageSize);
      setCandidates(data.candidates || []);
      setTotalCandidates(data.total || 0);
      setStats(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchCandidates(currentPage);
  }, [fetchCandidates, currentPage]);

  // Clear scored candidates
  const handleClearScored = useCallback(() => {
    setScoredCandidates(null);
    setSelectedJob(null);
  }, []);

  // Score candidates against a job
  const handleScoreCandidates = useCallback(async (job: JobDescription) => {
    try {
      setScoring(true);
      setSelectedJob(job);
      setShowJobsModal(false);
      
      const response = await cvApi.filter(job.id, 0, 100);
      setScoredCandidates(response.candidates);
    } catch (error) {
      console.error('Failed to score candidates:', error);
    } finally {
      setScoring(false);
    }
  }, []);

  // Export CSV
  const handleExportCsv = useCallback(async () => {
    if (!selectedJob) return;
    
    try {
      const blob = await cvApi.exportCsv(selectedJob.id, 0);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_${selectedJob.title.replace(/\s+/g, '_').toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [selectedJob]);

  // File upload handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;
    
    try {
      setUploading(true);
      setUploadStatus('Uploading and processing CVs...');
      
      const response = await cvApi.upload(uploadFiles);
      
      setUploadStatus(`✅ Uploaded: ${response.uploaded}, Failed: ${response.failed}`);
      
      await fetchCandidates(1);
      setCurrentPage(1);
      
      setTimeout(() => {
        setUploadFiles([]);
        setUploadStatus('');
        setShowUploadModal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus(`❌ Upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
  }, [uploadFiles, fetchCandidates]);

  // Sorting
  const sortCandidates = useCallback((list: Candidate[]) => {
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'experience':
          return (b.years_experience || 0) - (a.years_experience || 0);
        case 'score':
          return (b.match_score || 0) - (a.match_score || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [sortBy]);

  // View profile handler - fetch full details
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const handleViewProfile = useCallback(async (candidate: Candidate | AskResult | FilteredCandidate) => {
    // If it's a basic candidate from list, fetch full details
    if ('id' in candidate && candidate.id) {
      try {
        setLoadingProfile(true);
        const fullDetails = await cvApi.getById(candidate.id);
        setSelectedCandidate(fullDetails);
      } catch (error) {
        console.error('Failed to fetch candidate details:', error);
        // Fallback to basic data
        setSelectedCandidate(candidate);
      } finally {
        setLoadingProfile(false);
      }
    } else {
      setSelectedCandidate(candidate);
    }
  }, []);

  // Display logic
  const isScoredMode = scoredCandidates !== null;
  const displayCandidates = isScoredMode 
    ? scoredCandidates 
    : sortCandidates(candidates);
  
  const totalPages = Math.ceil(totalCandidates / pageSize);

  return (
    <div className="candidates-page">
      {/* Actions Bar */}
      <div className="page-actions">
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--kz-border)',
              background: 'var(--kz-bg-secondary)',
              color: 'var(--kz-text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="date">Sort: Latest</option>
            <option value="name">Sort: Name</option>
            <option value="experience">Sort: Experience</option>
            <option value="score">Sort: Score</option>
          </select>
          
          <Button variant="outline" onClick={() => setShowJobsModal(true)}>
            🎯 Score CVs
          </Button>
          
          {isScoredMode && selectedJob && (
            <Button variant="outline" onClick={handleExportCsv}>
              📥 Export CSV
            </Button>
          )}
          
          <Button className="upload-btn" onClick={() => setShowUploadModal(true)}>
            <span>📄</span> Upload CVs
          </Button>
        </div>
      </div>

      {/* Mode Indicator */}
      {isScoredMode && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'var(--kz-bg-secondary)', 
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <span style={{ color: 'var(--kz-accent-primary)' }}>🎯 Scoring against:</span>{' '}
            <strong>{selectedJob?.title}</strong>
            <span style={{ color: 'var(--kz-text-muted)', marginLeft: '12px' }}>
              {scoredCandidates.length} candidates scored
            </span>
          </span>
          <Button variant="outline" size="sm" onClick={handleClearScored}>Clear</Button>
        </div>
      )}

      {/* Stats */}
      <div className="candidates-stats">
        <div className="stat-pill">
          <span className="stat-pill-value">{stats.total}</span>
          <span className="stat-pill-label">Total Candidates</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{stats.newThisWeek}</span>
          <span className="stat-pill-label">New This Week</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{stats.avgMatchScore}%</span>
          <span className="stat-pill-label">Avg Match Score</span>
        </div>
      </div>

      {(loading || scoring) ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--kz-text-muted)' }}>
          {scoring ? '🎯 Scoring candidates against job requirements...' : 'Loading candidates...'}
        </div>
      ) : displayCandidates.length > 0 ? (
        <>
          <div className="candidates-grid">
            {displayCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                colorIndex={index}
                isScored={isScoredMode}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
          
          {/* Pagination - only for regular view */}
          {!isScoredMode && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalCandidates}
              pageSize={pageSize}
            />
          )}
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <CardContent>
            <p style={{ color: 'var(--kz-text-muted)', marginBottom: '16px' }}>
              {isScoredMode
                ? 'No candidates found for this job.'
                : 'No candidates found. Upload CVs to get started!'}
            </p>
            {!isScoredMode && (
              <Button onClick={() => setShowUploadModal(true)}>Upload CV</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Upload CVs</h2>
              <button 
                className="modal-close" 
                onClick={() => !uploading && setShowUploadModal(false)}
                type="button"
                disabled={uploading}
              >
                ✕
              </button>
            </div>
            
            <div className="upload-zone">
              <input
                type="file"
                accept=".pdf"
                multiple
                className="file-input"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <span className="upload-icon">📁</span>
              <p className="upload-text">Drop CVs here or click to browse</p>
              <p className="upload-subtext">Supports PDF files (multiple)</p>
            </div>

            {uploadFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ marginBottom: '8px', fontWeight: 500 }}>
                  Selected files ({uploadFiles.length}):
                </p>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {uploadFiles.map((file, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'var(--kz-bg-secondary)',
                        borderRadius: '6px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                      <button 
                        onClick={() => handleRemoveFile(index)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          color: 'var(--kz-text-muted)'
                        }}
                        disabled={uploading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadStatus && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'var(--kz-bg-secondary)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                {uploadStatus}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleUpload}
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? 'Processing...' : `Upload ${uploadFiles.length} file(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Modal */}
      <JobsModal
        isOpen={showJobsModal}
        onClose={() => setShowJobsModal(false)}
        onSelectJob={handleScoreCandidates}
      />

      {/* Candidate Profile Modal - Detailed View */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2>Candidate Profile</h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedCandidate(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Header with avatar */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: AVATAR_COLORS[0], 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  {selectedCandidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedCandidate.name}
                  </h3>
                  <p style={{ color: 'var(--kz-accent-primary)', fontSize: '1.1rem' }}>
                    {selectedCandidate.current_role || 'Role not specified'}
                  </p>
                  {'years_experience' in selectedCandidate && selectedCandidate.years_experience && (
                    <p style={{ color: 'var(--kz-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      {selectedCandidate.years_experience} years of experience
                      {'seniority_level' in selectedCandidate && selectedCandidate.seniority_level && 
                        ` • ${selectedCandidate.seniority_level}`}
                    </p>
                  )}
                  {'summary' in selectedCandidate && selectedCandidate.summary && (
                    <p style={{ color: 'var(--kz-text-secondary)', fontSize: '0.9rem', marginTop: '8px', fontStyle: 'italic' }}>
                      "{selectedCandidate.summary}"
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {'email' in selectedCandidate && (selectedCandidate.email || selectedCandidate.phone || selectedCandidate.location) && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--kz-bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.9rem' }}>
                    {selectedCandidate.email && (
                      <span>📧 {selectedCandidate.email}</span>
                    )}
                    {'phone' in selectedCandidate && selectedCandidate.phone && (
                      <span>📱 {selectedCandidate.phone}</span>
                    )}
                    {'location' in selectedCandidate && selectedCandidate.location && (
                      <span>📍 {selectedCandidate.location}</span>
                    )}
                    {'availability' in selectedCandidate && selectedCandidate.availability && (
                      <span>🕐 {selectedCandidate.availability}</span>
                    )}
                  </div>
                  {'social_links' in selectedCandidate && selectedCandidate.social_links && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {selectedCandidate.social_links.linkedin && (
                        <a href={selectedCandidate.social_links.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--kz-accent-primary)' }}>
                          💼 LinkedIn
                        </a>
                      )}
                      {selectedCandidate.social_links.github && (
                        <a href={selectedCandidate.social_links.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--kz-accent-primary)' }}>
                          🐙 GitHub
                        </a>
                      )}
                      {selectedCandidate.social_links.portfolio && (
                        <a href={selectedCandidate.social_links.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--kz-accent-primary)' }}>
                          🌐 Portfolio
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Skills Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                  💻 Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(Array.isArray(selectedCandidate.skills) ? selectedCandidate.skills : []).map((skill) => (
                    <span 
                      key={skill} 
                      className="skill-tag"
                      style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      {skill}
                    </span>
                  ))}
                  {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                    <span style={{ color: 'var(--kz-text-muted)' }}>No skills listed</span>
                  )}
                </div>
              </div>

              {/* Experiences Section */}
              {'experiences' in selectedCandidate && selectedCandidate.experiences && selectedCandidate.experiences.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    💼 Work Experience
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedCandidate.experiences.map((exp, index) => (
                      <div key={exp.id || index} style={{ padding: '12px', background: 'var(--kz-bg-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--kz-accent-primary)' }}>
                        <div style={{ fontWeight: 600 }}>{exp.role || 'Unknown Role'}</div>
                        <div style={{ color: 'var(--kz-text-muted)', fontSize: '0.9rem' }}>
                          {exp.company || 'Unknown Company'}
                          {exp.start_date && ` • ${exp.start_date} - ${exp.end_date || 'Present'}`}
                          {exp.duration_months && ` (${exp.duration_months} months)`}
                        </div>
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {exp.technologies.slice(0, 5).map(tech => (
                              <span key={tech} style={{ padding: '2px 8px', background: 'var(--kz-bg-tertiary)', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--kz-text-secondary)' }}>
                            {exp.achievements.slice(0, 2).map((ach, i) => (
                              <li key={i}>{ach}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {'education' in selectedCandidate && selectedCandidate.education && selectedCandidate.education.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    🎓 Education
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCandidate.education.map((edu, index) => (
                      <div key={edu.id || index} style={{ padding: '10px', background: 'var(--kz-bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{edu.degree || 'Degree'} {edu.field && `in ${edu.field}`}</div>
                        <div style={{ color: 'var(--kz-text-muted)', fontSize: '0.9rem' }}>
                          {edu.institution || 'Unknown Institution'}
                          {edu.graduation_year && ` • ${edu.graduation_year}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {'projects' in selectedCandidate && selectedCandidate.projects && selectedCandidate.projects.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    🚀 Projects
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCandidate.projects.map((proj, index) => (
                      <div key={proj.id || index} style={{ padding: '10px', background: 'var(--kz-bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{proj.name || 'Project'}</div>
                        {proj.description && (
                          <div style={{ color: 'var(--kz-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                            {proj.description.length > 150 ? proj.description.slice(0, 150) + '...' : proj.description}
                          </div>
                        )}
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {proj.technologies.slice(0, 5).map(tech => (
                              <span key={tech} style={{ padding: '2px 6px', background: 'var(--kz-bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem' }}>
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications Section */}
              {'certifications' in selectedCandidate && selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    📜 Certifications
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedCandidate.certifications.map((cert, index) => (
                      <span 
                        key={cert.id || index}
                        style={{ padding: '6px 12px', background: 'var(--kz-bg-secondary)', borderRadius: '6px', fontSize: '0.9rem' }}
                      >
                        ✅ {cert.name} {cert.issuer && `(${cert.issuer})`} {cert.year && `• ${cert.year}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags Section */}
              {'red_flags' in selectedCandidate && selectedCandidate.red_flags && selectedCandidate.red_flags.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px', color: '#ef4444' }}>
                    ⚠️ Red Flags
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCandidate.red_flags.map((flag, index) => (
                      <div 
                        key={flag.id || index}
                        style={{ 
                          padding: '10px', 
                          background: flag.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                          borderRadius: '6px',
                          borderLeft: `3px solid ${flag.severity === 'high' ? '#ef4444' : '#f59e0b'}`
                        }}
                      >
                        <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {flag.type.replace(/_/g, ' ')} 
                          <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: flag.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                            ({flag.severity})
                          </span>
                        </div>
                        {flag.evidence && (
                          <div style={{ color: 'var(--kz-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                            {flag.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Section (if available) */}
              {'final_score' in selectedCandidate && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    🎯 Match Score
                  </h4>
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--kz-bg-secondary)', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        background: RECOMMENDATION_COLORS[selectedCandidate.recommendation] || '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {Math.round(selectedCandidate.final_score)}%
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {selectedCandidate.recommendation}
                      </span>
                    </div>
                    
                    {selectedCandidate.score_breakdown && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                        <div>📊 Skill Match: <strong>{selectedCandidate.score_breakdown.skill_match_score.toFixed(0)}%</strong></div>
                        <div>📈 Experience: <strong>{selectedCandidate.score_breakdown.experience_score.toFixed(0)}%</strong></div>
                        <div>🎯 Role Match: <strong>{selectedCandidate.score_breakdown.role_similarity_score.toFixed(0)}%</strong></div>
                        <div>⚖️ Stability: <strong>{selectedCandidate.score_breakdown.stability_score.toFixed(0)}%</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {'score' in selectedCandidate && !('final_score' in selectedCandidate) && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '12px' }}>
                    🎯 Match Score
                  </h4>
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--kz-bg-secondary)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: AVATAR_COLORS[0],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600
                    }}>
                      {Math.round(selectedCandidate.score * 100)}%
                    </div>
                    <span>Semantic Match Score</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '16px', padding: '0 20px 20px' }}>
              <Button variant="default" onClick={() => setSelectedCandidate(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CandidatesPage;
