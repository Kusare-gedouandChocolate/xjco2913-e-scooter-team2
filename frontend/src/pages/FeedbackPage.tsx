// src/pages/FeedbackPage.tsx
import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../api';
import type { Feedback } from '../types';
import { StateWrapper } from '../components/StateWrapper';

export const FeedbackPage: React.FC = () => {
  // --- 身份与视图控制 ---
  // 为了演示方便，这里用一个状态来切换“用户视图”和“管理端视图”
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');

  // --- 用户端：提交反馈状态 ---
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('minor');
  const [scooterId, setScooterId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // --- 管理端：反馈处理状态 ---
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high'>('all');

  // --- 1. 用户端：提交反馈逻辑 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitResult({ type: 'error', msg: '请填写反馈内容' });
      return;
    }
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      await feedbackApi.submitFeedback({
        description,
        severity,
        scooterId: scooterId || undefined // 如果没填就不传
      });
      setSubmitResult({ type: 'success', msg: '反馈提交成功！感谢您的协助。' });
      setDescription('');
      setScooterId('');
      setSeverity('minor');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setSubmitResult({ type: 'error', msg: error.message || '提交失败，请重试' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- 2. 管理端：获取反馈列表逻辑 ---
  const fetchFeedbacks = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const params = filterPriority === 'high' ? { priority: 'high' } : undefined;
      const res = await feedbackApi.getAdminFeedback(params);
      setFeedbacks(res.data || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setAdminError(error.message || '获取反馈列表失败');
    } finally {
      setAdminLoading(false);
    }
  };

  // 切换到管理端视图或更改筛选条件时，重新拉取数据
  useEffect(() => {
    if (viewMode === 'admin') {
      fetchFeedbacks();
    }
  }, [viewMode, filterPriority]);

  // --- 3. 管理端：更新优先级逻辑 ---
  const handleUpdatePriority = async (issueId: string, newPriority: 'high' | 'low') => {
    try {
      await feedbackApi.updatePriority(issueId, { priority: newPriority });
      // 局部刷新列表状态，提升体验
      setFeedbacks(prev => prev.map(f => f.issueId === issueId ? { ...f, priority: newPriority } : f));
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || '优先级更新失败');
    }
  };

  return (
    <div style={styles.container}>
      {/* 顶部：视图切换器 (演示专用) */}
      <div style={styles.viewToggle}>
        <button 
          style={styles.toggleBtn(viewMode === 'customer')} 
          onClick={() => { setViewMode('customer'); setSubmitResult(null); }}
        >
          🙋‍♂️ 我要反馈 (Customer)
        </button>
        <button 
          style={styles.toggleBtn(viewMode === 'admin')} 
          onClick={() => setViewMode('admin')}
        >
          👨‍💻 处理中心 (Admin)
        </button>
      </div>

      {/* ============================== */}
      {/* 视图 A：普通用户 - 提交反馈表单 */}
      {/* ============================== */}
      {viewMode === 'customer' && (
        <div style={styles.formCard}>
          <h2 style={{ marginBottom: '8px' }}>提交问题反馈</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            如果您在使用车辆时遇到问题，请告诉我们。
          </p>

          {submitResult && (
            <div style={styles.alertBox(submitResult.type)}>
              {submitResult.type === 'success' ? '✅ ' : '❌ '}
              {submitResult.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>问题严重程度</label>
              <select 
                value={severity} 
                onChange={(e) => setSeverity(e.target.value)}
                style={styles.input}
              >
                <option value="minor">轻微 (Minor) - 不影响骑行</option>
                <option value="major">一般 (Major) - 影响部分体验</option>
                <option value="critical">严重 (Critical) - 无法骑行或有安全隐患</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>关联车辆编号 (可选)</label>
              <input 
                type="text" 
                placeholder="例如: SC-001"
                value={scooterId}
                onChange={(e) => setScooterId(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>问题描述</label>
              <textarea 
                rows={5}
                placeholder="请详细描述您遇到的问题..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' as const }}
              />
            </div>

            <button type="submit" style={styles.submitBtn} disabled={submitLoading}>
              {submitLoading ? '提交中...' : '提交反馈'}
            </button>
          </form>
        </div>
      )}

      {/* ============================== */}
      {/* 视图 B：管理员 - 反馈处理列表 */}
      {/* ============================== */}
      {viewMode === 'admin' && (
        <div>
          <div style={styles.adminHeader}>
            <h2>后台反馈处理中心</h2>
            <div style={styles.filterGroup}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>筛选：</label>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value as 'all' | 'high')}
                style={styles.filterSelect}
              >
                <option value="all">所有反馈</option>
                <option value="high">仅看高优先级 (High Priority)</option>
              </select>
            </div>
          </div>

          <StateWrapper 
            loading={adminLoading} 
            error={adminError} 
            empty={feedbacks.length === 0} 
            emptyMessage="当前没有需要处理的反馈"
            onRetry={fetchFeedbacks}
          >
            <div style={styles.listGrid}>
              {feedbacks.map(fb => (
                <div key={fb.issueId} style={styles.feedbackCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.badge(fb.priority === 'high' ? 'danger' : 'normal')}>
                      {fb.priority === 'high' ? '🚨 高优' : '🟢 普通'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      状态: {fb.status}
                    </span>
                  </div>
                  
                  <div style={styles.cardBody}>
                    <p style={styles.descText}>{fb.description}</p>
                    <div style={styles.metaInfo}>
                      <span>程度: <strong>{fb.severity}</strong></span>
                      {fb.scooterId && <span>车辆: {fb.scooterId}</span>}
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(fb.createdAt).toLocaleString()}
                    </span>
                    
                    {/* 优先级调整按钮 */}
                    {fb.priority === 'low' ? (
                      <button 
                        style={styles.actionBtn('high')}
                        onClick={() => handleUpdatePriority(fb.issueId, 'high')}
                      >
                        ↑ 标为高优
                      </button>
                    ) : (
                      <button 
                        style={styles.actionBtn('low')}
                        onClick={() => handleUpdatePriority(fb.issueId, 'low')}
                      >
                        ↓ 降为普通
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

// --- 内联样式字典 ---
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
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-border)',
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
  })
};