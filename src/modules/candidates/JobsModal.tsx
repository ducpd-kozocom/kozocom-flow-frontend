// ============================================================
// JobsModal - CRUD Modal for Job Descriptions
// ============================================================

import { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { jobsApi } from '@/lib/api';
import type { JobDescription } from '@/lib/api';

interface JobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob?: (job: JobDescription) => void;
}

interface JobFormData {
  title: string;
  description: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  min_years_experience: number | '';
  max_years_experience: number | '';
}

const emptyForm: JobFormData = {
  title: '',
  description: '',
  required_skills: [],
  nice_to_have_skills: [],
  min_years_experience: '',
  max_years_experience: '',
};

export const JobsModal = memo(function JobsModal({ isOpen, onClose, onSelectJob }: JobsModalProps) {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [form, setForm] = useState<JobFormData>(emptyForm);
  const [skillInput, setSkillInput] = useState('');
  const [niceSkillInput, setNiceSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobsApi.getAll();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen, fetchJobs]);

  const handleAddSkill = (type: 'required' | 'nice') => {
    const input = type === 'required' ? skillInput : niceSkillInput;
    if (!input.trim()) return;
    
    setForm(prev => ({
      ...prev,
      [type === 'required' ? 'required_skills' : 'nice_to_have_skills']: [
        ...prev[type === 'required' ? 'required_skills' : 'nice_to_have_skills'],
        input.trim()
      ]
    }));
    
    if (type === 'required') {
      setSkillInput('');
    } else {
      setNiceSkillInput('');
    }
  };

  const handleRemoveSkill = (type: 'required' | 'nice', index: number) => {
    setForm(prev => ({
      ...prev,
      [type === 'required' ? 'required_skills' : 'nice_to_have_skills']:
        prev[type === 'required' ? 'required_skills' : 'nice_to_have_skills'].filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (job: JobDescription) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description || '',
      required_skills: job.required_skills || [],
      nice_to_have_skills: job.nice_to_have_skills || [],
      min_years_experience: job.min_years_experience ?? '',
      max_years_experience: job.max_years_experience ?? '',
    });
    setShowForm(true);
  };

  const handleNewJob = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    
    try {
      setSaving(true);
      const jobData = {
        title: form.title,
        description: form.description || undefined,
        required_skills: form.required_skills,
        nice_to_have_skills: form.nice_to_have_skills,
        min_years_experience: form.min_years_experience || undefined,
        max_years_experience: form.max_years_experience || undefined,
        remote_allowed: false,
      };

      if (editingJob) {
        await jobsApi.update(editingJob.id, jobData);
      } else {
        await jobsApi.create(jobData);
      }
      
      await fetchJobs();
      setShowForm(false);
      setForm(emptyForm);
      setEditingJob(null);
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await jobsApi.delete(id);
      await fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}
      >
        <div className="modal-header">
          <h2>{showForm ? (editingJob ? 'Edit Job' : 'New Job') : 'Job Descriptions'}</h2>
          <button className="modal-close" onClick={onClose} type="button">✕</button>
        </div>

        {showForm ? (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Backend Developer"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Job description..."
                style={{ 
                  width: '100%', 
                  minHeight: '80px', 
                  padding: '8px', 
                  borderRadius: '6px',
                  border: '1px solid var(--kz-border)',
                  background: 'var(--kz-bg-secondary)',
                  color: 'var(--kz-text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Min Experience (years)</label>
                <Input
                  type="number"
                  value={form.min_years_experience}
                  onChange={(e) => setForm(prev => ({ ...prev, min_years_experience: e.target.value ? parseInt(e.target.value) : '' }))}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Max Experience (years)</label>
                <Input
                  type="number"
                  value={form.max_years_experience}
                  onChange={(e) => setForm(prev => ({ ...prev, max_years_experience: e.target.value ? parseInt(e.target.value) : '' }))}
                  placeholder="10"
                  min={0}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Required Skills</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('required'))}
                  placeholder="Type skill and press Enter"
                  style={{ flex: 1 }}
                />
                <Button variant="outline" onClick={() => handleAddSkill('required')}>Add</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.required_skills.map((skill, i) => (
                  <span key={i} className="skill-tag" style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill('required', i)}>
                    {skill} ✕
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Nice-to-Have Skills</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Input
                  value={niceSkillInput}
                  onChange={(e) => setNiceSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('nice'))}
                  placeholder="Type skill and press Enter"
                  style={{ flex: 1 }}
                />
                <Button variant="outline" onClick={() => handleAddSkill('nice')}>Add</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.nice_to_have_skills.map((skill, i) => (
                  <span key={i} className="skill-tag" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleRemoveSkill('nice', i)}>
                    {skill} ✕
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="default" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : (editingJob ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <Button variant="default" onClick={handleNewJob} style={{ marginBottom: '16px' }}>
              + New Job Description
            </Button>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--kz-text-muted)' }}>
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--kz-text-muted)' }}>
                No job descriptions yet. Create one to start scoring candidates!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: '16px',
                      background: 'var(--kz-bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--kz-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{job.title}</h3>
                        {job.min_years_experience !== undefined && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--kz-text-muted)' }}>
                            Experience: {job.min_years_experience}{job.max_years_experience ? `-${job.max_years_experience}` : '+'} years
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(job.id)} style={{ color: '#ef4444' }}>Delete</Button>
                      </div>
                    </div>
                    
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--kz-text-muted)' }}>Required: </span>
                        {job.required_skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="skill-tag" style={{ fontSize: '0.75rem' }}>{skill}</span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--kz-text-muted)' }}> +{job.required_skills.length - 5} more</span>
                        )}
                      </div>
                    )}

                    {onSelectJob && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => onSelectJob(job)}
                        style={{ marginTop: '8px' }}
                      >
                        🎯 Score Candidates
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default JobsModal;
