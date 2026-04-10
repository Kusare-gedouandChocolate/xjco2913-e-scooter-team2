// src/pages/BookingPage.tsx
import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../api';
import type { Booking } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { formatPrice } from '../utils/format';

export const BookingPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 记录正在执行取消操作的订单 ID，用于展示局部 Loading 态
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.getMyBookings();
      setBookings(res.data || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || '获取预订记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    // 增加二次确认，防止误触
    if (!window.confirm('确定要取消这个预订吗？')) return;
    
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancelBooking(bookingId);
      // 取消成功后刷新列表
      await fetchBookings();
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || '取消失败，当前状态可能不允许取消'); // [cite: 473]
    } finally {
      setCancellingId(null);
    }
  };

  const isCancelableStatus = (status: Booking['status']) => {
    return ['pendingPayment', 'confirmed', 'PENDING_PAYMENT', 'PAID'].includes(status);
  };

  // 状态样式映射字典：根据 UML 状态机返回不同视觉 [cite: 325-339]
  const getStatusConfig = (status: Booking['status']) => {
    switch (status) {
      case 'pendingPayment':
      case 'PENDING_PAYMENT':
        return { label: '待支付', color: '#f59e0b', bg: '#fef3c7' }; // 橙黄
      case 'confirmed':
      case 'PAID':
        return { label: '已确认', color: 'var(--color-primary)', bg: '#e6f7f6' }; // 石绿
      case 'active':
      case 'extended':
        return { label: '进行中', color: 'var(--color-primary)', bg: '#e6f7f6' }; // 石绿
      case 'completed':
        return { label: '已完成', color: 'var(--color-text-muted)', bg: '#f1f5f9' }; // 灰色
      case 'cancelled':
      case 'CANCELLED':
        return { label: '已取消', color: 'var(--color-accent)', bg: '#fff1f2' }; // 山茶红
      default:
        return { label: '未知状态', color: '#94a3b8', bg: '#f8fafc' };
    }
  };

  // 格式化 UTC 时间为本地易读格式
  const formatDate = (isoString: string) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>我的行程</h1>
        <p style={styles.subtitle}>查看您的预订记录与历史订单</p>
      </header>

      <StateWrapper 
        loading={loading} 
        error={error} 
        empty={bookings.length === 0}
        emptyMessage="您还没有任何预订记录，快去开启第一段旅程吧！"
        onRetry={fetchBookings}
      >
        <div style={styles.list}>
          {bookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status);
            // 只有 pendingPayment 或 confirmed（开始前）允许取消 [cite: 326, 330, 331]
            const canCancel = isCancelableStatus(booking.status);
            const totalCost = typeof booking.totalCost === 'string' ? Number(booking.totalCost) : booking.totalCost;

            return (
              <div key={booking.bookingId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.scooterInfo}>
                    <span style={styles.scooterIcon}>🛴</span>
                    <span style={styles.scooterCode}>车辆 #{booking.scooterId.slice(-4)}</span>
                  </div>
                  <span style={styles.badge(statusConfig.color, statusConfig.bg)}>
                    {statusConfig.label}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>预订时长</span>
                    <span style={styles.infoValue}>{booking.hireType}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>开始时间</span>
                    <span style={styles.infoValue}>{formatDate(booking.startTime)}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>总费用</span>
                    <span style={styles.priceValue}>{formatPrice(Number.isFinite(totalCost) ? totalCost : 0)}</span>
                  </div>
                </div>

                {/* 操作区：如果是可取消状态，展示山茶红取消按钮 */}
                {canCancel && (
                  <div style={styles.cardFooter}>
                    <button 
                      style={styles.cancelBtn(cancellingId === booking.bookingId)}
                      disabled={cancellingId === booking.bookingId}
                      onClick={() => handleCancel(booking.bookingId)}
                    >
                      {cancellingId === booking.bookingId ? '正在取消...' : '取消预订'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </StateWrapper>
    </div>
  );
};

// --- 内联样式字典 ---
const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px', // 记录页不需要铺太宽，窄一点更聚光
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    color: 'var(--color-text-main)',
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px dashed var(--color-border)',
  },
  scooterInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scooterIcon: {
    fontSize: '1.5rem',
  },
  scooterCode: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
  },
  badge: (color: string, bg: string) => ({
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: color,
    backgroundColor: bg,
  }),
  cardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
  },
  infoValue: {
    color: 'var(--color-text-main)',
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  priceValue: {
    color: 'var(--color-text-main)',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  cardFooter: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cancelBtn: (isCancelling: boolean) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: isCancelling ? '#fca5a5' : 'var(--color-accent)', // 山茶红
    backgroundColor: isCancelling ? '#fef2f2' : '#fff1f2', // 极浅山茶红底色
    border: 'none',
    cursor: isCancelling ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
  })
};
