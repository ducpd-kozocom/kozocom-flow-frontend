// ============================================================
// Dashboard Module - Page Component
// ============================================================

import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

interface DashboardStats {
  totalCandidates: number;
  newCandidatesThisWeek: number;
  totalReviews: number;
  totalErrors: number;
  securityIssues: number;
}

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ title, value, icon, trend, trendUp, loading }: StatCardProps) {
  return (
    <Card className="stat-card">
      <CardHeader className="stat-header">
        <span className="stat-icon">{icon}</span>
        <CardTitle className="stat-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="stat-content">
        <span className="stat-value">{loading ? '...' : value}</span>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────
export const DashboardPage = memo(function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ id: number; text: string; time: string }[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const data = await dashboardApi.getOverview();
        setStats({
          totalCandidates: data.candidates.total,
          newCandidatesThisWeek: data.candidates.newThisWeek,
          totalReviews: data.reviews.totalReviews,
          totalErrors: data.reviews.totalErrors,
          securityIssues: data.reviews.securityIssues,
        });
        
        const activities = [];
        if (data.candidates.newThisWeek > 0) {
          activities.push({ id: 1, text: `${data.candidates.newThisWeek} new candidates this week`, time: 'This week' });
        }
        if (data.reviews.totalErrors > 0) {
          activities.push({ id: 2, text: `${data.reviews.totalErrors} total errors found in reviews`, time: 'Recent' });
        }
        if (data.reviews.securityIssues > 0) {
          activities.push({ id: 3, text: `${data.reviews.securityIssues} security issues detected`, time: 'Recent' });
        }
        activities.push({ id: 4, text: 'Dashboard loaded from database', time: 'Just now' });
        setRecentActivity(activities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setRecentActivity([
          { id: 1, text: 'No data available. Check database connection.', time: 'Now' }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statsCards = [
    { title: 'Total Candidates', value: stats?.totalCandidates ?? 0, icon: '👥', trend: stats?.newCandidatesThisWeek ? `+${stats.newCandidatesThisWeek}` : undefined, trendUp: true },
    { title: 'Code Reviews', value: stats?.totalReviews ?? 0, icon: '💻' },
    { title: 'Total Errors', value: stats?.totalErrors ?? 0, icon: '🐛' },
    { title: 'Security Issues', value: stats?.securityIssues ?? 0, icon: '🔐' },
  ];

  return (
    <div className="dashboard">
      <section className="stats-grid">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={loading} />
        ))}
      </section>

      <div className="dashboard-grid">
        <Card className="activity-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <li key={activity.id} className="activity-item">
                    <div className="activity-indicator" />
                    <div className="activity-content">
                      <p className="activity-text">{activity.text}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="activity-item">
                  <div className="activity-indicator" />
                  <div className="activity-content">
                    <p className="activity-text">Loading activity...</p>
                  </div>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="quick-actions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="quick-actions-grid">
            <button className="quick-action-btn" type="button">
              <span className="action-icon">📄</span>
              <span>Upload CV</span>
            </button>
            <button className="quick-action-btn" type="button">
              <span className="action-icon">📊</span>
              <span>View Reports</span>
            </button>
            <button className="quick-action-btn" type="button">
              <span className="action-icon">🔍</span>
              <span>Search Candidates</span>
            </button>
            <button className="quick-action-btn" type="button">
              <span className="action-icon">🧠</span>
              <span>Ask AI</span>
            </button>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span> Top Skills in Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="skills-chart">
              <div className="skill-bar">
                <span className="skill-name">React</span>
                <div className="skill-progress" style={{ width: '85%' }} />
                <span className="skill-count">45</span>
              </div>
              <div className="skill-bar">
                <span className="skill-name">Node.js</span>
                <div className="skill-progress" style={{ width: '72%' }} />
                <span className="skill-count">38</span>
              </div>
              <div className="skill-bar">
                <span className="skill-name">Python</span>
                <div className="skill-progress" style={{ width: '65%' }} />
                <span className="skill-count">34</span>
              </div>
              <div className="skill-bar">
                <span className="skill-name">TypeScript</span>
                <div className="skill-progress" style={{ width: '58%' }} />
                <span className="skill-count">30</span>
              </div>
              <div className="skill-bar">
                <span className="skill-name">MySQL</span>
                <div className="skill-progress" style={{ width: '45%' }} />
                <span className="skill-count">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default DashboardPage;
