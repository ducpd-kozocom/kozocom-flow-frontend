import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reviewsApi, repositoriesApi } from '@/lib/reviewer-api';
import type { ReviewStats, Repository, PRReview } from '@/lib/reviewer-api';
import { StatCard, RepoCard } from './components';

export const ReviewsPage = memo(function ReviewsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reviewsApi.getStats('month').catch(() => null),
      repositoriesApi.getAll().catch(() => []),
      reviewsApi.getAll({ period: 'month' }).catch(() => []),
    ]).then(([s, r, rev]) => {
      setStats(s);
      setRepos(r);
      setReviews(rev);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="reviews-page">
      <div className="review-stats-row">
        {[1,2,3,4].map(i => <div key={i} className="stat-card skeleton-card"><div className="skeleton-content" /></div>)}
      </div>
      <div className="reviews-grid">
        <div className="repos-card skeleton-card"><div className="skeleton-content" /></div>
        <div className="reviews-sidebar">
          <div className="chart-card skeleton-card"><div className="skeleton-content" /></div>
        </div>
      </div>
    </div>
  );

  const repoReviews = (repoId: number) => reviews.filter(r => r.repository_id === repoId);

  return (
    <div className="reviews-page">
      <div className="review-stats-row">
        <StatCard icon="📝" value={stats?.totalReviews ?? 0} label="Reviews" />
        <StatCard icon="🐛" value={stats?.totalErrors ?? 0} label="Issues" />
        <StatCard icon="📊" value={stats?.avgErrorsPerReview ?? 0} label="Avg/Review" />
        <StatCard icon="🔐" value={stats?.securityIssues ?? 0} label="Critical" />
      </div>

      <div className="reviews-grid">
        <Card className="repos-card">
          <CardHeader>
            <CardTitle className="chart-title">📦 Connected Repositories</CardTitle>
          </CardHeader>
          <CardContent className="repos-list">
            {repos.length > 0 ? repos.map(repo => (
              <RepoCard
                key={repo.id}
                repo={repo}
                reviews={repoReviews(repo.id)}
                hasConfig={false}
                onClick={() => navigate(`/reviews/repo/${repo.id}`)}
              />
            )) : (
              <p className="empty-state">No repositories connected yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="reviews-sidebar">
          <Card className="chart-card">
            <CardHeader>
              <CardTitle className="chart-title">📈 Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="line-chart">
                <div className="line-chart-area">
                  {stats?.weeklyTrend?.length ? stats.weeklyTrend.map(w => {
                    const max = Math.max(...stats.weeklyTrend.map(x => x.errors));
                    const height = max > 0 ? (w.errors / max) * 100 : 0;
                    return (
                      <div key={w.week} className="line-point-container">
                        <div className="line-bar" style={{ height: `${height}%` }} />
                        <span className="point-value">{w.errors}</span>
                        <span className="line-label">{w.week}</span>
                      </div>
                    );
                  }) : <p className="empty-state">No data</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="chart-card">
            <CardHeader>
              <CardTitle className="chart-title">👥 Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bar-chart">
                {stats?.developerStats?.length ? stats.developerStats.slice(0, 5).map(dev => {
                  const max = Math.max(...stats.developerStats.map(d => d.errors));
                  const width = max > 0 ? (dev.errors / max) * 100 : 0;
                  return (
                    <div key={dev.name} className="bar-row">
                      <span className="bar-label">{dev.name}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${width}%`, background: dev.color }} />
                      </div>
                      <span className="bar-value">{dev.errors}</span>
                    </div>
                  );
                }) : <p className="empty-state">No data</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="recent-reviews-card">
        <CardHeader>
          <CardTitle className="chart-title">📋 Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Repo</th>
                  <th>PR</th>
                  <th>Author</th>
                  <th>Issues</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.slice(0, 10).map(r => (
                  <tr key={r.id} onClick={() => navigate(`/reviews/${r.id}`)} className="clickable">
                    <td>{repos.find(repo => repo.id === r.repository_id)?.name || 'Unknown'}</td>
                    <td><span className="pr-link">#{r.pr_number} {r.pr_title?.slice(0, 30)}</span></td>
                    <td>{r.pr_author || 'Unknown'}</td>
                    <td>
                      {r.count_critical > 0 && <span className="error-badge security">{r.count_critical}</span>}
                      {r.count_warning > 0 && <span className="error-badge logic">{r.count_warning}</span>}
                      {r.count_critical === 0 && r.count_warning === 0 && <span className="error-badge syntax">✓</span>}
                    </td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No reviews yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default ReviewsPage;
