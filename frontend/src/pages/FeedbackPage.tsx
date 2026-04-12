import React, { useEffect, useState } from 'react';
import { feedbackApi } from '../api';
import type { Feedback } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { isManager } from '../utils/auth';

type FeedbackCategory = 'BUG_REPORT' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
type AdminFilterPriority = 'all' | 'HIGH';

const categoryLabelMap: Record<Feedback['category'], string> = {
  BUG_REPORT: 'Bug Report',
  COMPLAINT: 'Complaint',
  SUGGESTION: 'Suggestion',
  OTHER: 'Other',
};

const statusLabelMap: Record<Feedback['status'], string> = {
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const FeedbackPage: React.FC = () => {
  const manager = isManager();
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('SUGGESTION');
  const [scooterId, setScooterId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<AdminFilterPriority>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setSubmitResult({ type: 'error', msg: 'Please enter feedback details.' });
      return;
    }

    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      await feedbackApi.submitFeedback({
        content,
        category,
        scooterId: scooterId.trim() ? Number(scooterId) : undefined,
      });
      setSubmitResult({ type: 'success', msg: 'Feedback submitted successfully.' });
      setContent('');
      setScooterId('');
      setCategory('SUGGESTION');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setSubmitResult({ type: 'error', msg: error.message || 'Failed to submit feedback.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const params = filterPriority === 'HIGH' ? { priority: 'HIGH' as const } : undefined;
      const res = await feedbackApi.getAdminFeedback(params);
      setFeedbacks(res.data?.content ?? []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setAdminError(error.message || 'Failed to load feedback list.');
      setFeedbacks([]);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (manager && viewMode === 'admin') {
      fetchFeedbacks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, viewMode, filterPriority]);

  const handleUpdatePriority = async (feedbackId: string, newPriority: 'HIGH' | 'LOW') => {
    try {
      await feedbackApi.updatePriority(feedbackId, { priority: newPriority });
      setFeedbacks((prev) =>
        prev.map((fb) => (fb.feedbackId === feedbackId ? { ...fb, priority: newPriority } : fb))
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Failed to update priority.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.viewToggle}>
        <button
          style={styles.toggleBtn(viewMode === 'customer')}
          onClick={() => {
            setViewMode('customer');
            setSubmitResult(null);
          }}
        >
          Submit Feedback
        </button>
        {manager && (
          <button
            style={styles.toggleBtn(viewMode === 'admin')}
            onClick={() => setViewMode('admin')}
          >
            Processing Center
          </button>
        )}
      </div>

      {viewMode === 'customer' && (
        <div style={styles.formCard}>
          <h2 style={{ marginBottom: '8px' }}>Submit Feedback</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Report a problem or suggestion related to your scooter usage.
          </p>

          {submitResult && (
            <div style={styles.alertBox(submitResult.type)}>
              {submitResult.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                style={styles.input}
              >
                <option value="BUG_REPORT">Bug Report</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Scooter ID (optional)</label>
              <input
                type="text"
                placeholder="Example: 1"
                value={scooterId}
                onChange={(e) => setScooterId(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Details</label>
              <textarea
                rows={5}
                placeholder="Describe the issue or suggestion..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' as const }}
              />
            </div>

            <button type="submit" style={styles.submitBtn} disabled={submitLoading}>
              {submitLoading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {manager && viewMode === 'admin' && (
        <div>
          <div style={styles.adminHeader}>
            <h2>Feedback Processing Center</h2>
            <div style={styles.filterGroup}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Priority:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as AdminFilterPriority)}
                style={styles.filterSelect}
              >
                <option value="all">All</option>
                <option value="HIGH">High Priority Only</option>
              </select>
            </div>
          </div>

          <StateWrapper
            loading={adminLoading}
            error={adminError}
            empty={feedbacks.length === 0}
            emptyMessage="No feedback to process."
            onRetry={fetchFeedbacks}
          >
            <div style={styles.listGrid}>
              {feedbacks.map((fb) => (
                <div key={fb.feedbackId} style={styles.feedbackCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.badge(fb.priority === 'HIGH' ? 'danger' : 'normal')}>
                      {fb.priority === 'HIGH' ? 'High Priority' : 'Normal Priority'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {statusLabelMap[fb.status]}
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    <p style={styles.descText}>{fb.content}</p>
                    <div style={styles.metaInfo}>
                      <span>Category: <strong>{categoryLabelMap[fb.category]}</strong></span>
                      {fb.scooterId && <span>Scooter: {fb.scooterId}</span>}
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(fb.createdAt).toLocaleString()}
                    </span>

                    {fb.priority === 'LOW' ? (
                      <button
                        style={styles.actionBtn('high')}
                        onClick={() => handleUpdatePriority(fb.feedbackId, 'HIGH')}
                      >
                        Mark High
                      </button>
                    ) : (
                      <button
                        style={styles.actionBtn('low')}
                        onClick={() => handleUpdatePriority(fb.feedbackId, 'LOW')}
                      >
                        Mark Normal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </StateWrapper>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  viewToggle: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '6px',
    borderRadius: '12px',
    marginBottom: '32px',
    gap: '8px',
  },
  toggleBtn: (isActive: boolean) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    backgroundColor: isActive ? '#fff' : 'transparent',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  formCard: {
    backgroundColor: 'var(--color-surface)',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  alertBox: (type: 'success' | 'error') => ({
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: type === 'success' ? '#e6f7f6' : '#fff1f2',
    color: type === 'success' ? 'var(--color-primary)' : 'var(--color-accent)',
    fontWeight: 600,
  }),
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontWeight: 600,
    color: 'var(--color-text-main)',
    fontSize: '0.95rem',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1.05rem',
    cursor: 'pointer',
    border: 'none',
    marginTop: '10px',
  },
  adminHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    outline: 'none',
  },
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  feedbackCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: (type: 'danger' | 'normal') => ({
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 700,
    backgroundColor: type === 'danger' ? '#fff1f2' : '#f1f5f9',
    color: type === 'danger' ? 'var(--color-accent)' : 'var(--color-text-muted)',
  }),
  cardBody: {
    flex: 1,
  },
  descText: {
    fontSize: '1rem',
    lineHeight: 1.5,
    color: 'var(--color-text-main)',
    marginBottom: '12px',
  },
  metaInfo: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    backgroundColor: '#f8fafc',
    padding: '8px',
    borderRadius: '6px',
    flexWrap: 'wrap' as const,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-border)',
    gap: '12px',
  },
  actionBtn: (action: 'high' | 'low') => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    backgroundColor: action === 'high' ? '#fff1f2' : '#f1f5f9',
    color: action === 'high' ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'background-color 0.2s',
  }),
};
