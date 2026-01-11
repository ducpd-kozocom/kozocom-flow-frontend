import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { BreakingChange } from '@/lib/api';

interface Props {
  change: BreakingChange;
}

export const BreakingChangeCard = memo(function BreakingChangeCard({ change }: Props) {
  const [expanded, setExpanded] = useState(true);
  const isCritical = change.severity === 'critical';

  return (
    <Card className={`bc-card ${isCritical ? 'critical' : 'warning'}`}>
      <CardContent className="bc-content">
        {/* Header */}
        <div className="bc-header">
          <span className={`bc-badge ${change.severity}`}>
            {isCritical ? 'CRITICAL' : 'WARNING'}
          </span>
          <span className="bc-file">{change.file_path}:{change.line_number}</span>
        </div>

        {/* Method/Entity Info */}
        <div className="bc-entity">
          <span className="bc-entity-type">{change.entity_type}</span>
          <code className="bc-entity-name">
            {change.class_name && <span className="bc-class">{change.class_name}::</span>}
            {change.entity_name}()
          </code>
        </div>

        {/* Change Description */}
        <div className="bc-section">
          <div className="bc-section-title">What changed</div>
          <p className="bc-description">{change.change_detail}</p>
        </div>

        {/* Code Diff */}
        {(change.old_definition || change.new_definition) && (
          <div className="bc-section">
            <div className="bc-section-title">Code Diff</div>
            <div className="bc-code-diff">
              {change.old_definition && (
                <div className="bc-code-line removed">
                  <span className="bc-code-prefix">-</span>
                  <code>{change.old_definition}</code>
                </div>
              )}
              {change.new_definition && (
                <div className="bc-code-line added">
                  <span className="bc-code-prefix">+</span>
                  <code>{change.new_definition}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Affected Files */}
        {change.affected_callers.length > 0 && (
          <div className="bc-section">
            <button className="bc-affected-toggle" onClick={() => setExpanded(!expanded)}>
              <span className="bc-section-title">
                Affected Files <span className="bc-count">{change.affected_count}</span>
              </span>
              <span className="bc-toggle-icon">{expanded ? '▼' : '▶'}</span>
            </button>
            {expanded && (
              <div className="bc-affected-list">
                {change.affected_callers.map((caller, i) => (
                  <div key={i} className="bc-affected-item">
                    <div className="bc-affected-file">
                      <span className="bc-file-icon">📄</span>
                      <code>{caller.file_path}:{caller.line_number}</code>
                    </div>
                    {caller.break_reason && (
                      <p className="bc-affected-reason">{caller.break_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        {change.recommendation && (
          <div className="bc-recommendation">
            <span className="bc-rec-icon">💡</span>
            <p>{change.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
