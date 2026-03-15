// src/pages/ScooterPage.tsx
import React, { useState, useEffect } from 'react';
import { scootersApi, bookingsApi } from '../api';
import type { Scooter, PricingRule } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { formatPrice, getUTCTimeString } from '../utils/format';

export const ScooterPage: React.FC = () => {
  // --- 页面数据状态 ---
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 预订模态框交互状态 ---
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [selectedHireType, setSelectedHireType] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'idle' | 'booking' | 'paying' | 'success'>('idle');
  const [actionError, setActionError] = useState<string>('');

  // 初始加载数据
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 并发请求车辆和价格规则
      const [scootersRes, rulesRes] = await Promise.all([
        scootersApi.getScooters(),
        scootersApi.getPricingRules()
      ]);
      setScooters(scootersRes.data || []);
      setRules(rulesRes.data || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || '获取车辆数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 打开预订弹窗
  const handleOpenBooking = (scooter: Scooter) => {
    setSelectedScooter(scooter);
    setSelectedHireType(rules[0]?.hireType || ''); // 默认选中第一个套餐
    setBookingStep('idle');
    setActionError('');
  };

  // 提交流程：创建订单 -> 模拟支付 [cite: 304-307]
  const handleConfirmBooking = async () => {
    if (!selectedScooter || !selectedHireType) return;
    setBookingStep('booking');
    setActionError('');

    try {
      // 1. 创建订单
      const bookingRes = await bookingsApi.createBooking({
        scooterId: selectedScooter.scooterId,
        hireType: selectedHireType,
        startTime: getUTCTimeString(),
      });
      
      const bId = bookingRes.data.bookingId;
      setBookingStep('paying');

      // 2. 发起模拟支付
      await bookingsApi.payBooking({ bookingId: bId });
      
      setBookingStep('success');
      // 刷新列表，将被租用的车过滤掉或更新状态
      fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      // 业务错误码，如 409 Conflict 车辆被抢占 [cite: 463]
      setActionError(error.message || '操作失败，请重试');
      setBookingStep('idle');
    }
  };

  return (
    <div style={styles.container}>
      {/* 顶部标题区 */}
      <header style={styles.header}>
        <div>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.8rem' }}>附近车辆</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>选择一辆滑板车，开启您的绿色旅程</p>
        </div>
      </header>

      {/* 列表渲染区 (复用规范状态组件) [cite: 481] */}
      <StateWrapper 
        loading={loading} 
        error={error} 
        empty={scooters.length === 0}
        emptyMessage="当前区域暂无可租用的滑板车"
        onRetry={fetchData}
      >
        <div style={styles.grid}>
          {scooters.map((scooter) => (
            <div key={scooter.scooterId} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.scooterCode}>🛴 #{scooter.code}</span>
                {/* 状态指示器：根据可用性展示石绿或山茶红 */}
                <span style={styles.badge(scooter.status === 'available')}>
                  {scooter.status === 'available' ? '可租用' : '使用中'}
                </span>
              </div>
              <div style={styles.cardBody}>
                <p style={styles.locationInfo}>
                  <svg style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {scooter.location}
                </p>
                <div style={styles.priceRow}>
                  <span style={styles.priceLabel}>基础费率</span>
                  <span style={styles.priceValue}>{formatPrice(scooter.basePrice)}/次</span>
                </div>
              </div>
              <button 
                style={styles.bookBtn(scooter.status === 'available')}
                disabled={scooter.status !== 'available'}
                onClick={() => handleOpenBooking(scooter)}
              >
                立即预订
              </button>
            </div>
          ))}
        </div>
      </StateWrapper>

      {/* 预订与支付弹窗 (Modal) */}
      {selectedScooter && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {bookingStep === 'success' ? (
              // 成功状态视图 (石绿主题)
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>支付成功！</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>车辆解锁码已发送，请安全骑行。</p>
                <button style={styles.primaryBtn} onClick={() => setSelectedScooter(null)}>
                  完成并关闭
                </button>
              </div>
            ) : (
              // 预订与支付交互视图
              <>
                <h2 style={{ marginBottom: '16px' }}>确认预订</h2>
                <p style={{ marginBottom: '20px', color: 'var(--color-text-muted)' }}>
                  您正在预订车辆 <strong>#{selectedScooter.code}</strong>
                </p>

                {actionError && (
                  <div style={styles.errorBox}>{actionError}</div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={styles.label}>请选择租赁时长套餐：</label>
                  <div style={styles.radioGroup}>
                    {rules.map((rule) => (
                      <label 
                        key={rule.ruleId} 
                        style={styles.radioOption(selectedHireType === rule.hireType)}
                      >
                        <input 
                          type="radio" 
                          name="hireType" 
                          value={rule.hireType}
                          checked={selectedHireType === rule.hireType}
                          onChange={(e) => setSelectedHireType(e.target.value)}
                          style={{ display: 'none' }} 
                        />
                        <span style={{ fontWeight: 600 }}>{rule.hireType} 套餐</span>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{formatPrice(rule.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button 
                    style={styles.cancelBtn} 
                    onClick={() => setSelectedScooter(null)}
                    disabled={bookingStep !== 'idle'}
                  >
                    取消
                  </button>
                  <button 
                    style={styles.confirmBtn} 
                    onClick={handleConfirmBooking}
                    disabled={bookingStep !== 'idle'}
                  >
                    {bookingStep === 'booking' ? '正在锁单...' : bookingStep === 'paying' ? '正在扣款...' : '确认并支付'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 内联样式字典 ---
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '12px',
  },
  scooterCode: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  badge: (isAvailable: boolean) => ({
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: 600,
    backgroundColor: isAvailable ? '#e6f7f6' : '#fff1f2',
    color: isAvailable ? 'var(--color-primary)' : 'var(--color-accent)',
  }),
  cardBody: {
    flexGrow: 1,
    marginBottom: '20px',
  },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
    marginBottom: '12px',
  },
  icon: {
    width: '18px',
    height: '18px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-bg)',
    padding: '10px 12px',
    borderRadius: '8px',
  },
  priceLabel: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
  },
  priceValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
  },
  bookBtn: (isAvailable: boolean) => ({
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 600,
    backgroundColor: isAvailable ? 'var(--color-primary)' : '#e2e8f0',
    color: isAvailable ? '#fff' : '#94a3b8',
    cursor: isAvailable ? 'pointer' : 'not-allowed',
    transition: 'opacity 0.2s',
  }),
  // 模态框相关样式
  modalOverlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: '20px',
    padding: '32px',
    width: '90%',
    maxWidth: '440px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginBottom: '12px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  radioOption: (isSelected: boolean) => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    borderRadius: '12px',
    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
    backgroundColor: isSelected ? '#f0fafa' : '#fff', // 选中时带极浅的石绿底色
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    color: 'var(--color-text-main)',
    fontWeight: 600,
  },
  confirmBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)', // 石绿支付按钮
    color: '#fff',
    fontWeight: 600,
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 600,
  },
  successIcon: {
    width: '64px',
    height: '64px',
    lineHeight: '64px',
    backgroundColor: '#e6f7f6',
    color: 'var(--color-primary)',
    borderRadius: '50%',
    fontSize: '32px',
    margin: '0 auto 16px',
    fontWeight: 'bold',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fff1f2',
    color: 'var(--color-accent)', // 山茶红报错
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.9rem',
    fontWeight: 500,
  }
};