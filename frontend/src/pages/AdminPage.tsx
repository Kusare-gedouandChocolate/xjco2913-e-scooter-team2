// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { adminApi, scootersApi } from '../api';
import type { Scooter, PricingRule } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { formatPrice } from '../utils/format';

export const AdminPage: React.FC = () => {
  // --- 视图与加载状态 ---
  const [activeTab, setActiveTab] = useState<'scooters' | 'pricing'>('scooters');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 数据源 ---
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);

  // --- 编辑弹窗状态 ---
  const [editingScooter, setEditingScooter] = useState<Scooter | null>(null);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [editFormError, setEditFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- 获取数据 ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'scooters') {
        const res = await adminApi.getAllScooters();
        setScooters(res.data || []);
      } else {
        // 价格规则公用同一个获取接口即可
        const res = await scootersApi.getPricingRules();
        setRules(res.data || []);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || '获取管理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- 提交车辆更新 ---
  const handleSaveScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScooter) return;
    setActionLoading(true);
    setEditFormError('');
    try {
      await adminApi.updateScooter(editingScooter.scooterId, {
        status: editingScooter.status,
        basePrice: Number(editingScooter.basePrice)
      });
      setEditingScooter(null);
      fetchData(); // 刷新列表
    } catch (err: unknown) {
      const e = err as { message?: string };
      setEditFormError(e.message || '更新车辆失败');
    } finally {
      setActionLoading(false);
    }
  };

  // --- 提交价格更新 ---
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setActionLoading(true);
    setEditFormError('');
    try {
      await adminApi.updatePricingRule(editingRule.ruleId, {
        price: Number(editingRule.price)
      });
      setEditingRule(null);
      fetchData(); // 刷新列表
    } catch (err: unknown) {
      const e = err as { message?: string };
      setEditFormError(e.message || '更新价格失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.8rem' }}>⚙️ 系统配置中心</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>管理全部车辆状态与全局价格参数</p>
      </header>

      {/* 标签页导航 */}
      <div style={styles.tabs}>
        <button 
          style={styles.tab(activeTab === 'scooters')} 
          onClick={() => setActiveTab('scooters')}
        >
          🛴 车辆管理
        </button>
        <button 
          style={styles.tab(activeTab === 'pricing')} 
          onClick={() => setActiveTab('pricing')}
        >
          💰 价格与套餐
        </button>
      </div>

      <StateWrapper loading={loading} error={error} onRetry={fetchData}>
        
        {/* ============================== */}
        {/* 面板 A：车辆管理 */}
        {/* ============================== */}
        {activeTab === 'scooters' && (
          <div style={styles.grid}>
            {scooters.map(scooter => (
              <div key={scooter.scooterId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>#{scooter.code}</span>
                  <span style={styles.badge(scooter.status)}>
                    {scooter.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <p>位置: <strong>{scooter.location}</strong></p>
                  <p>基础费率: <strong>{formatPrice(scooter.basePrice)}</strong></p>
                </div>
                <button 
                  style={styles.editBtn} 
                  onClick={() => setEditingScooter({ ...scooter })}
                >
                  配置车辆
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ============================== */}
        {/* 面板 B：价格与套餐管理 */}
        {/* ============================== */}
        {activeTab === 'pricing' && (
          <div style={styles.grid}>
            {rules.map(rule => (
              <div key={rule.ruleId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                    {rule.hireType} 套餐
                  </span>
                  {rule.discountEnabled && <span style={styles.discountBadge}>惠</span>}
                </div>
                <div style={styles.cardBody}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '16px 0' }}>
                    {formatPrice(rule.price)}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    允许折扣: {rule.discountEnabled ? '是' : '否'}
                  </p>
                </div>
                <button 
                  style={styles.editBtn} 
                  onClick={() => setEditingRule({ ...rule })}
                >
                  修改定价
                </button>
              </div>
            ))}
          </div>
        )}

      </StateWrapper>

      {/* ============================== */}
      {/* 弹窗 A：编辑车辆 */}
      {/* ============================== */}
      {editingScooter && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>配置车辆 #{editingScooter.code}</h2>
            {editFormError && <div style={styles.errorBox}>{editFormError}</div>}
            
            <form onSubmit={handleSaveScooter} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={styles.label}>车辆状态</label>
                <select 
                  style={styles.input}
                  value={editingScooter.status}
                  onChange={(e) => setEditingScooter({ ...editingScooter, status: e.target.value as 'available' | 'reserved' | 'unavailable' | 'maintenance' })}
                >
                  <option value="available">可用 (Available)</option>
                  <option value="maintenance">维护中 (Maintenance)</option>
                  <option value="unavailable">下线 (Unavailable)</option>
                </select>
              </div>
              
              <div>
                <label style={styles.label}>基础费率 (单位: 分)</label>
                <input 
                  type="number" 
                  style={styles.input}
                  value={editingScooter.basePrice}
                  onChange={(e) => setEditingScooter({ ...editingScooter, basePrice: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setEditingScooter(null)}>取消</button>
                <button type="submit" style={styles.confirmBtn} disabled={actionLoading}>
                  {actionLoading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* 弹窗 B：编辑价格 */}
      {/* ============================== */}
      {editingRule && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>修改定价: {editingRule.hireType} 套餐</h2>
            {editFormError && <div style={styles.errorBox}>{editFormError}</div>}
            
            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={styles.label}>新价格 (单位: 分)</label>
                <input 
                  type="number" 
                  style={styles.input}
                  value={editingRule.price}
                  onChange={(e) => setEditingRule({ ...editingRule, price: parseInt(e.target.value) || 0 })}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  提示: 当前输入等值于 {formatPrice(editingRule.price)}
                </p>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setEditingRule(null)}>取消</button>
                <button type="submit" style={styles.confirmBtn} disabled={actionLoading}>
                  {actionLoading ? '保存中...' : '保存价格'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// --- 内联样式字典 ---
const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  tabs: {
    display: 'flex', gap: '12px', marginBottom: '24px',
    borderBottom: '2px solid var(--color-border)', paddingBottom: '12px'
  },
  tab: (isActive: boolean) => ({
    padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s',
    backgroundColor: isActive ? 'var(--color-primary)' : '#f1f5f9',
    color: isActive ? '#fff' : 'var(--color-text-muted)',
  }),
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'
  },
  card: {
    backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  badge: (status: string) => ({
    padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
    backgroundColor: status === 'available' ? '#e6f7f6' : status === 'maintenance' ? '#fef3c7' : '#f1f5f9',
    color: status === 'available' ? 'var(--color-primary)' : status === 'maintenance' ? '#d97706' : 'var(--color-text-muted)'
  }),
  discountBadge: {
    padding: '2px 6px', backgroundColor: '#fee2e2', color: 'var(--color-accent)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
  },
  cardBody: { color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' },
  editBtn: {
    width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#f8fafc', color: 'var(--color-primary)', border: '1px solid #cbd5e1', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
  },
  // Modal 样式复用
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  label: { display: 'block', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' as const },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: 'var(--color-text-main)', fontWeight: 600, border: 'none', cursor: 'pointer' },
  confirmBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' },
  errorBox: { padding: '12px', backgroundColor: '#fff1f2', color: 'var(--color-accent)', borderRadius: '8px', marginTop: '16px', fontSize: '0.9rem', fontWeight: 500 },
};