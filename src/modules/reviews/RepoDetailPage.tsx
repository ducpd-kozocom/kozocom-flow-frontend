import { memo, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reviewsApi, repositoriesApi } from '@/lib/reviewer-api';
import type { Repository, PRReview } from '@/lib/reviewer-api';
import { StatCard, PRCard, ConfigSheet } from './components';

type FilterStatus = 'all' | 'issues' | 'clean';

export const RepoDetailPage = memo(function RepoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      repositoriesApi.getById(+id).catch(() => null),
      reviewsApi.getAll({ repository_id: +id }).catch(() => []),
    ]).then(([r, rev]) => {
      setRepo(r);
      setReviews(rev);
    }).finally(() => setLoading(false));
  }, [id]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = !search || 
        r.pr_title?.toLowerCase().includes(search.toLowerCase()) ||
        r.pr_author?.toLowerCase().includes(search.toLowerCase()) ||
        r.pr_number.toString().includes(search);
      
      const hasIssues = r.count_critical > 0 || r.count_warning > 0;
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'issues' && hasIssues) ||
        (statusFilter === 'clean' && !hasIssues);
      
      return matchSearch && matchStatus;
    });
  }, [reviews, search, statusFilter]);

  if (loading) return (
    <div className="repo-detail-page">
      <div className="skeleton-back" />
      <div className="repo-header-card skeleton-card"><div className="skeleton-content" /></div>
      <div className="review-stats-row">
        {[1,2,3,4].map(i => <div key={i} className="stat-card skeleton-card"><div className="skeleton-content" /></div>)}
      </div>
      <div className="pr-list-card skeleton-card"><div className="skeleton-content" /></div>
    </div>
  );
  if (!repo) return <div className="repo-detail-page error">Repository not found</div>;

  const totalIssues = reviews.reduce((sum, r) => sum + r.count_critical + r.count_warning, 0);
  const criticalCount = reviews.reduce((sum, r) => sum + r.count_critical, 0);
  const warningCount = reviews.reduce((sum, r) => sum + r.count_warning, 0);

  return (
    <div className="repo-detail-page">
      <button className="back-link" onClick={() => navigate('/reviews')}>← Back to Reviews</button>

      <Card className="repo-header-card">
        <CardContent className="repo-header-content">
          <div className="repo-header-top">
            <div className="repo-info">
              <span className={`repo-status-dot ${repo.is_active ? 'active' : ''}`} />
              <h2>{repo.full_name}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>⚙️ Config</Button>
          </div>
          <p className="repo-meta">
            Connected {repo.connected_at ? new Date(repo.connected_at).toLocaleDateString() : 'N/A'}
            {repo.last_review_at && ` · Last review ${new Date(repo.last_review_at).toLocaleDateString()}`}
          </p>
        </CardContent>
      </Card>

      <div className="review-stats-row">
        <StatCard icon="📝" value={reviews.length} label="Reviews" />
        <StatCard icon="🐛" value={totalIssues} label="Total Issues" />
        <StatCard icon="🔴" value={criticalCount} label="Critical" />
        <StatCard icon="🟡" value={warningCount} label="Warnings" />
      </div>

      <Card className="pr-list-card">
        <CardHeader className="pr-list-header">
          <CardTitle className="chart-title">📋 PR Reviews</CardTitle>
          <div className="pr-filters">
            <Input
              className="pr-search"
              placeholder="Search PR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="filter-buttons">
              <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
              <button className={`filter-btn ${statusFilter === 'issues' ? 'active' : ''}`} onClick={() => setStatusFilter('issues')}>Has Issues</button>
              <button className={`filter-btn ${statusFilter === 'clean' ? 'active' : ''}`} onClick={() => setStatusFilter('clean')}>Clean</button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-list">
          {filteredReviews.length > 0 ? filteredReviews.map(review => (
            <PRCard key={review.id} review={review} onClick={() => navigate(`/reviews/${review.id}`)} />
          )) : (
            <p className="empty-state">{reviews.length === 0 ? 'No reviews yet.' : 'No matching reviews.'}</p>
          )}
        </CardContent>
      </Card>

      <ConfigSheet repo={repo} open={showConfig} onClose={() => setShowConfig(false)} onSave={() => {}} />
    </div>
  );
});

export default RepoDetailPage;
