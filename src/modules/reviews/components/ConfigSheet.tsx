import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Repository, RepoConfig } from '@/lib/api';
import { repositoriesApi } from '@/lib/api';

interface Props {
  repo: Repository;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_CONFIG: Partial<RepoConfig> = {
  enabled: true,
  auto_review: true,
  review_drafts: false,
  min_severity: 'warning',
  include_patterns: ['*.php', '*.js', '*.ts', '*.py'],
  exclude_patterns: ['*test*', '*vendor*', '*node_modules*'],
  slack_channel: '',
  notify_on: 'critical',
};

export const ConfigSheet = memo(function ConfigSheet({ repo, open, onClose, onSave }: Props) {
  const [config, setConfig] = useState<Partial<RepoConfig>>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    repositoriesApi.getConfig(repo.id)
      .then(setConfig)
      .catch(() => setConfig(DEFAULT_CONFIG))
      .finally(() => setLoading(false));
  }, [repo.id, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await repositoriesApi.saveConfig(repo.id, config);
      onSave();
      onClose();
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof RepoConfig>(key: K, value: RepoConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  if (!open) return null;

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className={`config-sheet ${open ? 'open' : ''}`}>
        <div className="sheet-header">
          <h2>⚙️ Configuration</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <p className="sheet-subtitle">{repo.full_name}</p>

        {loading ? (
          <div className="sheet-loading">Loading...</div>
        ) : (
          <div className="sheet-body">
            <div className="config-section">
              <h3>Review Settings</h3>
              <label className="checkbox-row">
                <input type="checkbox" checked={config.enabled} onChange={e => update('enabled', e.target.checked)} />
                <span>Enable reviews</span>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={config.auto_review} onChange={e => update('auto_review', e.target.checked)} />
                <span>Auto review on PR open</span>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={config.review_drafts} onChange={e => update('review_drafts', e.target.checked)} />
                <span>Review draft PRs</span>
              </label>
            </div>

            <div className="config-section">
              <h3>Severity Threshold</h3>
              <div className="radio-group">
                {['critical', 'warning', 'info'].map(level => (
                  <label key={level} className="radio-row">
                    <input type="radio" name="severity" checked={config.min_severity === level} onChange={() => update('min_severity', level)} />
                    <span>{level === 'critical' ? 'Critical only' : level === 'warning' ? 'Warning+' : 'All'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="config-section">
              <h3>File Patterns</h3>
              <Label>Include</Label>
              <Input
                value={config.include_patterns?.join(', ') || ''}
                onChange={e => update('include_patterns', e.target.value.split(',').map(s => s.trim()))}
                placeholder="*.php, *.js"
              />
              <Label>Exclude</Label>
              <Input
                value={config.exclude_patterns?.join(', ') || ''}
                onChange={e => update('exclude_patterns', e.target.value.split(',').map(s => s.trim()))}
                placeholder="*test*, *vendor*"
              />
            </div>

            <div className="config-section">
              <h3>Notifications</h3>
              <Label>Slack channel</Label>
              <Input
                value={config.slack_channel || ''}
                onChange={e => update('slack_channel', e.target.value)}
                placeholder="#pr-reviews"
              />
            </div>
          </div>
        )}

        <div className="sheet-footer">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
});
