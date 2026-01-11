import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '../../../components/ui/switch';
import type { Repository, RepoConfig } from '@/lib/reviewer-api';
import { repositoriesApi } from '@/lib/reviewer-api';

interface Props {
  repo: Repository;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const LANGUAGES = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'vi', label: '🇻🇳 Tiếng Việt' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'zh', label: '🇨🇳 中文' },
];

const NOTIFY_OPTIONS = [
  { value: 'all', label: 'All issues' },
  { value: 'critical', label: 'Critical only' },
  { value: 'none', label: 'Disabled' },
];

export const ConfigSheet = memo(function ConfigSheet({ repo, open, onClose, onSave }: Props) {
  const [config, setConfig] = useState<Partial<RepoConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    repositoriesApi.getConfig(repo.id)
      .then(setConfig)
      .catch(() => setConfig({}))
      .finally(() => setLoading(false));
  }, [repo.id, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await repositoriesApi.updateConfig(repo.id, config);
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
      <div className="config-sheet open">
        <div className="sheet-header">
          <h2>⚙️ Configuration</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <p className="sheet-subtitle">{repo.full_name}</p>

        {loading ? (
          <div className="sheet-loading">Loading...</div>
        ) : (
          <div className="sheet-body">
            {/* Review Behavior */}
            <div className="config-section">
              <h3>Review Behavior</h3>
              <div className="config-row">
                <div className="config-row-info">
                  <span className="config-label">Enable reviews</span>
                  <span className="config-desc">Turn on/off code review for this repository</span>
                </div>
                <Switch checked={config.enabled ?? true} onCheckedChange={v => update('enabled', v)} />
              </div>
              <div className="config-row">
                <div className="config-row-info">
                  <span className="config-label">Auto review on PR open</span>
                  <span className="config-desc">Automatically start review when PR is opened</span>
                </div>
                <Switch checked={config.auto_review ?? true} onCheckedChange={v => update('auto_review', v)} />
              </div>
              <div className="config-row">
                <div className="config-row-info">
                  <span className="config-label">Review on PR update</span>
                  <span className="config-desc">Re-review when PR is updated with new commits</span>
                </div>
                <Switch checked={config.review_on_update ?? false} onCheckedChange={v => update('review_on_update', v)} />
              </div>
            </div>

            {/* File Filtering */}
            <div className="config-section">
              <h3>File Filtering</h3>
              <div className="config-field">
                <Label>Include patterns</Label>
                <textarea
                  className="config-textarea"
                  value={config.include_patterns?.join('\n') || ''}
                  onChange={e => update('include_patterns', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                  placeholder="*.php&#10;*.js&#10;*.ts"
                  rows={3}
                />
                <span className="config-hint">One glob pattern per line. Leave empty to include all files.</span>
              </div>
              <div className="config-field">
                <Label>Exclude patterns</Label>
                <textarea
                  className="config-textarea"
                  value={config.exclude_patterns?.join('\n') || ''}
                  onChange={e => update('exclude_patterns', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                  placeholder="*.min.js&#10;*.min.css&#10;**/*.lock"
                  rows={4}
                />
                <span className="config-hint">One glob pattern per line. Files matching will be skipped.</span>
              </div>
            </div>

            {/* Output */}
            <div className="config-section">
              <h3>Output</h3>
              <div className="config-field">
                <Label>Language</Label>
                <div className="config-select-grid">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.value}
                      type="button"
                      className={`config-select-btn ${config.output_language === l.value ? 'active' : ''}`}
                      onClick={() => update('output_language', l.value)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="config-section">
              <h3>Notifications</h3>
              <div className="config-field">
                <Label>Slack channel</Label>
                <Input
                  value={config.slack_channel || ''}
                  onChange={e => update('slack_channel', e.target.value || null)}
                  placeholder="#pr-reviews"
                />
              </div>
              <div className="config-field">
                <Label>Notify on</Label>
                <div className="config-select-row">
                  {NOTIFY_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      className={`config-select-btn ${config.slack_notify_on === o.value ? 'active' : ''}`}
                      onClick={() => update('slack_notify_on', o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="config-row">
                <div className="config-row-info">
                  <span className="config-label">Post comments on GitHub</span>
                  <span className="config-desc">Add review comments directly to the PR</span>
                </div>
                <Switch checked={config.github_comment ?? true} onCheckedChange={v => update('github_comment', v)} />
              </div>
            </div>

            {/* Agents */}
            <div className="config-section">
              <h3>Agents</h3>
              <div className="config-row disabled">
                <div className="config-row-info">
                  <span className="config-label">🔍 Breaking Change Detection</span>
                  <span className="config-desc">Detect breaking changes in method signatures</span>
                </div>
                <Switch checked disabled />
              </div>
              <div className="config-row disabled">
                <div className="config-row-info">
                  <span className="config-label">📝 Code Review</span>
                  <span className="config-desc">AI-powered code review and suggestions</span>
                </div>
                <Switch checked disabled />
              </div>
              <p className="config-agents-note">Core agents cannot be disabled</p>
            </div>
          </div>
        )}

        <div className="sheet-footer">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
});
