import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { PRReview } from '@/lib/api';

interface Props {
  review: PRReview;
  onClick: () => void;
}

const timeAgo = (date: string | null) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const PRCard = memo(function PRCard({ review, onClick }: Props) {
  const hasIssues = review.count_critical > 0 || review.count_warning > 0;
  
  return (
    <Card className={`pr-card ${hasIssues ? 'has-issues' : 'clean'}`} onClick={onClick}>
      <CardContent className="pr-card-content">
        <div className="pr-card-top">
          <div className="pr-card-left">
            <div className="pr-title-row">
              <span className="pr-number">#{review.pr_number}</span>
              <span className="pr-title">{review.pr_title || 'Untitled PR'}</span>
            </div>
            <div className="pr-branch-info">
              <span className="branch-badge base">{review.base_branch || 'main'}</span>
              <span className="branch-arrow">←</span>
              <span className="branch-badge head">{review.head_branch || 'feature'}</span>
            </div>
          </div>
          <div className="pr-card-right">
            <div className="pr-issues-badges">
              {review.count_critical > 0 && <span className="issue-badge critical">{review.count_critical}</span>}
              {review.count_warning > 0 && <span className="issue-badge warning">{review.count_warning}</span>}
              {!hasIssues && <span className="issue-badge success">✓</span>}
            </div>
          </div>
        </div>
        <div className="pr-card-bottom">
          <span className="pr-author">by {review.pr_author || 'unknown'}</span>
          <span className="pr-time">{timeAgo(review.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
});
