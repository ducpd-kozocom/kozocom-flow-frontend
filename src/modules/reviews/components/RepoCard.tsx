import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Repository, PRReview } from '@/lib/api';

interface Props {
  repo: Repository;
  reviews: PRReview[];
  hasConfig: boolean;
  onClick: () => void;
}

export const RepoCard = memo(function RepoCard({ repo, reviews, hasConfig, onClick }: Props) {
  const criticalCount = reviews.reduce((sum, r) => sum + r.count_critical, 0);
  const reviewCount = reviews.length;

  return (
    <Card className="repo-card" onClick={onClick}>
      <CardContent className="repo-card-content">
        <div className="repo-header">
          <span className={`repo-status ${repo.is_active ? 'active' : ''}`} />
          <span className="repo-name">{repo.full_name}</span>
        </div>
        <div className="repo-stats">
          <span>{reviewCount} reviews</span>
          <span>·</span>
          <span className={criticalCount > 0 ? 'critical' : ''}>{criticalCount} critical</span>
        </div>
        <div className="repo-config-status">
          {hasConfig ? (
            <span className="configured">⚙️ Configured</span>
          ) : (
            <span className="not-configured">⚠️ Not configured</span>
          )}
        </div>
        <span className="repo-arrow">→</span>
      </CardContent>
    </Card>
  );
});
