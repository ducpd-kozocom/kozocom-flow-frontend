// ============================================================
// Reviews Module - Page Component
// ============================================================

import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reviewsApi } from '@/lib/api';
import type { ReviewStats, CodeReview } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// REVIEWS PAGE
// ─────────────────────────────────────────────────────────────
export const ReviewsPage = memo(function ReviewsPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, reviewsData] = await Promise.all([
          reviewsApi.getStats('month'),
          reviewsApi.getAll({ period: 'month' })
        ]);
        setStats(statsData);
        setReviews(reviewsData.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch review data:', error);
        setStats({
          totalReviews: 0,
          totalErrors: 0,
          avgErrorsPerReview: 0,
          securityIssues: 0,
          developerStats: [],
          errorTypes: { syntax: 0, logic: 0, security: 0 },
          weeklyTrend: []
        });
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalErrorsByType = stats ? 
    (stats.errorTypes.syntax + stats.errorTypes.logic + stats.errorTypes.security) : 0;

  const pieData = stats ? [
    { label: 'Syntax', value: stats.errorTypes.syntax, color: '#6366f1', offset: 0 },
    { label: 'Logic', value: stats.errorTypes.logic, color: '#8b5cf6', offset: stats.errorTypes.syntax },
    { label: 'Security', value: stats.errorTypes.security, color: '#ec4899', offset: stats.errorTypes.syntax + stats.errorTypes.logic },
  ] : [];

  if (loading) {
    return (
      <div className="code-reviews-page" style={{ textAlign: 'center', padding: '40px' }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="code-reviews-page">
      <div className="review-stats-row">
        <Card className="review-stat-card">
          <CardContent className="review-stat-content">
            <span className="review-stat-icon">📝</span>
            <div className="review-stat-info">
              <span className="review-stat-value">{stats?.totalReviews || 0}</span>
              <span className="review-stat-label">Total Reviews</span>
            </div>
          </CardContent>
        </Card>
        <Card className="review-stat-card">
          <CardContent className="review-stat-content">
            <span className="review-stat-icon">🐛</span>
            <div className="review-stat-info">
              <span className="review-stat-value">{stats?.totalErrors || 0}</span>
              <span className="review-stat-label">Total Errors</span>
            </div>
          </CardContent>
        </Card>
        <Card className="review-stat-card">
          <CardContent className="review-stat-content">
            <span className="review-stat-icon">📊</span>
            <div className="review-stat-info">
              <span className="review-stat-value">{stats?.avgErrorsPerReview || 0}</span>
              <span className="review-stat-label">Avg Errors/Review</span>
            </div>
          </CardContent>
        </Card>
        <Card className="review-stat-card">
          <CardContent className="review-stat-content">
            <span className="review-stat-icon">🔐</span>
            <div className="review-stat-info">
              <span className="review-stat-value">{stats?.securityIssues || 0}</span>
              <span className="review-stat-label">Security Issues</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="charts-grid">
        <Card className="chart-card-large">
          <CardHeader>
            <CardTitle className="chart-title">
              <span>📊</span> Top Errors by Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bar-chart">
              {stats?.developerStats && stats.developerStats.length > 0 ? (
                stats.developerStats.map((dev) => {
                  const maxErrors = Math.max(...stats.developerStats.map(d => d.errors));
                  const width = maxErrors > 0 ? (dev.errors / maxErrors) * 100 : 0;
                  return (
                    <div key={dev.name} className="bar-row">
                      <span className="bar-label">{dev.name}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${width}%`, background: dev.color }} />
                      </div>
                      <span className="bar-value">{dev.errors}</span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--kz-text-muted)', textAlign: 'center' }}>
                  No review data available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="chart-title">
              <span>🎯</span> Error Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <svg className="pie-svg" viewBox="0 0 100 100">
                  {totalErrorsByType > 0 ? (
                    pieData.map((segment) => {
                      const percentage = segment.value / totalErrorsByType;
                      const strokeDasharray = `${percentage * 314} 314`;
                      const strokeDashoffset = -((segment.offset / totalErrorsByType) * 314);
                      return (
                        <circle
                          key={segment.label}
                          cx="50" cy="50" r="50"
                          fill="transparent"
                          stroke={segment.color}
                          strokeWidth="100"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                      );
                    })
                  ) : (
                    <circle cx="50" cy="50" r="50" fill="var(--kz-bg-main)" />
                  )}
                </svg>
                <div className="pie-center">
                  <span className="pie-total">{totalErrorsByType}</span>
                  <span className="pie-label">Total</span>
                </div>
              </div>
              <div className="pie-legend">
                {pieData.map((item) => (
                  <div key={item.label} className="legend-item">
                    <span className="legend-color" style={{ background: item.color }} />
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="chart-title">
              <span>📈</span> Weekly Bug Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="line-chart">
              <div className="line-chart-area">
                {stats?.weeklyTrend && stats.weeklyTrend.length > 0 ? (
                  stats.weeklyTrend.map((week) => {
                    const maxErrors = Math.max(...stats.weeklyTrend.map(w => w.errors));
                    const height = maxErrors > 0 ? (week.errors / maxErrors) * 100 : 0;
                    return (
                      <div key={week.week} className="line-point-container">
                        <div className="line-bar" style={{ height: `${height}%` }} />
                        <span className="point-value">{week.errors}</span>
                        <span className="line-label">{week.week}</span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--kz-text-muted)', textAlign: 'center', width: '100%' }}>
                    No weekly data available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="reviews-table-card mt-4">
        <CardHeader>
          <CardTitle className="chart-title">
            <span>📋</span> Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>PR Link</th>
                  <th>Date</th>
                  <th>Syntax</th>
                  <th>Logic</th>
                  <th>Security</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length > 0 ? (
                  reviews.map((review) => {
                    const errorTypes = typeof review.error_types === 'string' 
                      ? JSON.parse(review.error_types) 
                      : review.error_types;
                    return (
                      <tr key={review.id}>
                        <td>
                          <div className="developer-cell">
                            <div className="developer-avatar-small">
                              {review.developer_name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <span>{review.developer_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <a href={review.pr_link} className="pr-link" target="_blank" rel="noopener noreferrer">
                            {review.pr_link || 'N/A'}
                          </a>
                        </td>
                        <td>{review.review_date ? new Date(review.review_date).toLocaleDateString() : 'N/A'}</td>
                        <td><span className="error-badge syntax">{errorTypes?.syntax || 0}</span></td>
                        <td><span className="error-badge logic">{errorTypes?.logic || 0}</span></td>
                        <td><span className="error-badge security">{errorTypes?.security || 0}</span></td>
                        <td><span className="error-badge total">{review.total_errors || 0}</span></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--kz-text-muted)', padding: '24px' }}>
                      No reviews found.
                    </td>
                  </tr>
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
