import { memo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reviewsApi } from '@/lib/reviewer-api';
import type { PRReview } from '@/lib/reviewer-api';
import { StatCard, BreakingChangeCard } from './components';

export const ReviewDetailPage = memo(function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<PRReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    reviewsApi.getById(+id)
      .then(setReview)
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="review-detail-page">
      <div className="skeleton-back" />
      <div className="review-header-card skeleton-card"><div className="skeleton-content" /></div>
      <div className="review-stats-row stats-3">
        {[1,2,3].map(i => <div key={i} className="stat-card skeleton-card"><div className="skeleton-content" /></div>)}
      </div>
      <div className="breaking-changes-card skeleton-card"><div className="skeleton-content" /></div>
    </div>
  );
  if (!review) return <div className="review-detail-page error">Review not found</div>;

  const statusIcon = review.status === 'completed' ? '✅' : review.status === 'failed' ? '❌' : '⏳';

  return (
    <div className="review-detail-page">
      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>

      <Card className="review-header-card">
        <CardContent className="review-header-content">
          <div className="review-title-row">
            <h2>PR #{review.pr_number}: {review.pr_title || 'Untitled'}</h2>
            <Button variant="outline" onClick={() => window.open(review.pr_link, '_blank')}>
              View on GitHub ↗
            </Button>
          </div>
          <p className="review-meta">
            by {review.pr_author || 'unknown'} · {review.base_branch} ← {review.head_branch}
            {review.created_at && ` · ${new Date(review.created_at).toLocaleDateString()}`}
          </p>
          <p className="review-status">
            Status: {statusIcon} {review.status}
          </p>
        </CardContent>
      </Card>

      <div className="review-stats-row stats-3">
        <StatCard icon="📁" value={review.total_files} label="Files" />
        <StatCard icon="🔴" value={review.count_critical} label="Critical" />
        <StatCard icon="🟡" value={review.count_warning} label="Warnings" />
      </div>

      <Card className="breaking-changes-card">
        <CardHeader>
          <CardTitle className="chart-title">🚨 Breaking Changes Detected</CardTitle>
        </CardHeader>
        <CardContent className="breaking-changes-list">
          {review.breaking_changes?.length ? (
            review.breaking_changes.map(bc => (
              <BreakingChangeCard key={bc.id} change={bc} />
            ))
          ) : (
            <p className="empty-state">No breaking changes detected in this PR.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default ReviewDetailPage;
