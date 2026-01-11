import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  icon: string;
  value: number | string;
  label: string;
}

export const StatCard = memo(function StatCard({ icon, value, label }: Props) {
  return (
    <Card className="review-stat-card">
      <CardContent className="review-stat-content">
        <span className="review-stat-icon">{icon}</span>
        <div className="review-stat-info">
          <span className="review-stat-value">{value}</span>
          <span className="review-stat-label">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
});
