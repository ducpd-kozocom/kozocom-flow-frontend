// ============================================================
// Candidates Module - Page Component
// ============================================================

import { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { candidatesApi } from '@/lib/api';
import type { Candidate } from '@/lib/api';

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
// CANDIDATE CARD COMPONENT
// ─────────────────────────────────────────────────────────────
interface CandidateCardProps {
  candidate: Candidate;
  colorIndex: number;
  onView?: (id: number) => void;
}

const CandidateCard = memo(function CandidateCard({ candidate, colorIndex, onView }: CandidateCardProps) {
  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  
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
            <p className="candidate-experience">
              {candidate.years_experience ? `${candidate.years_experience} years experience` : 'Experience not specified'}
            </p>
          </div>
          <div className="candidate-score">
            <div 
              className="score-circle" 
              style={{ background: AVATAR_COLORS[colorIndex % AVATAR_COLORS.length] }}
            >
              <span className="score-value">{candidate.match_score || 0}%</span>
            </div>
            <span className="score-label">Match</span>
          </div>
        </div>
        
        <div className="candidate-skills">
          {skills.slice(0, 5).map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
          {skills.length > 5 && (
            <span className="skill-tag">+{skills.length - 5} more</span>
          )}
        </div>

        <div className="candidate-actions">
          <Button variant="outline" size="sm" onClick={() => onView?.(candidate.id)}>
            View Profile
          </Button>
          <Button variant="primary" size="sm">
            Schedule Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// CANDIDATES PAGE
// ─────────────────────────────────────────────────────────────
export const CandidatesPage = memo(function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, newThisWeek: 0, avgMatchScore: 0 });

  const fetchCandidates = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const data = await candidatesApi.getAll(search);
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await candidatesApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, [fetchCandidates, fetchStats]);

  const handleSearch = useCallback(() => {
    fetchCandidates(searchQuery);
  }, [fetchCandidates, searchQuery]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className="candidates-page">
      <div className="page-actions">
        <div style={{ display: 'flex', gap: '12px' }}>
          <Input
            placeholder="Search candidates..."
            className="search-input-large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>
        <Button className="upload-btn" onClick={() => setShowUploadModal(true)}>
          <span>📄</span> Upload CV
        </Button>
      </div>

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--kz-text-muted)' }}>
          Loading candidates...
        </div>
      ) : candidates.length > 0 ? (
        <div className="candidates-grid">
          {candidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              colorIndex={index}
            />
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <CardContent>
            <p style={{ color: 'var(--kz-text-muted)', marginBottom: '16px' }}>
              No candidates found. Upload CVs to get started!
            </p>
            <Button onClick={() => setShowUploadModal(true)}>Upload CV</Button>
          </CardContent>
        </Card>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload CV</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowUploadModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="upload-zone">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('File selected:', file.name);
                    alert('CV upload feature coming soon!');
                    setShowUploadModal(false);
                  }
                }}
              />
              <span className="upload-icon">📁</span>
              <p className="upload-text">Drop your CV here or click to browse</p>
              <p className="upload-subtext">Supports PDF, DOC, DOCX</p>
            </div>
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CandidatesPage;
