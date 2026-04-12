// src/pages/BookingPage.tsx
import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../api';
import type { Booking, BookingStatus } from '../types';
import { StateWrapper } from '../components/StateWrapper';

// 辅助函数：格式化后端返回的价格字符串（单位为元）
const formatPriceFromString = (value?: string): string => {
  if (!value) return '¥ 0.00';
  const num = parseFloat(value);
  return isNaN(num) ? '¥ 0.00' : `¥ ${(num / 100).toFixed(2)}`;
};

export const BookingPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

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
    if (!window.confirm('确定要取消此预订吗？')) return;
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancelBooking(bookingId);
      await fetchBookings(); // 刷新列表
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || '取消失败，当前状态可能不允许取消。');
    } finally {
      setCancellingId(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    if (!window.confirm('确定要结束此行程吗？')) return;
    setCompletingId(bookingId);
    try {
      await bookingsApi.completeBooking(bookingId);
      await fetchBookings();
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || '结束行程失败，请重试。');
    } finally {
      setCompletingId(null);
    }
  };

  // 状态样式映射（与后端 BookingStatus 对齐）
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'PAID':
        return { label: '已确认', color: 'var(--color-primary)', bg: '#e6f7f6' };
      case 'PENDING_PAYMENT':
        return { label: '待支付', color: '#f59e0b', bg: '#fef3c7' };
      case 'CANCELLED':
        return { label: '已取消', color: 'var(--color-accent)', bg: '#fff1f2' };
      case 'COMPLETED':
        return { label: '已完成', color: 'var(--color-text-muted)', bg: '#f1f5f9' };
      default:
        return { label: '未知', color: '#94a3b8', bg: '#f8fafc' };
    }
  };

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
            emptyMessage="您还没有任何预订记录，快去开启一段旅程吧！"
            onRetry={fetchBookings}
        >
          <div style={styles.list}>
            {bookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              // 只有 PENDING_PAYMENT 或 PAID 状态允许取消（与后端一致）
              const canCancel = booking.status === 'PENDING_PAYMENT' || booking.status === 'PAID';
              const canComplete = booking.status === 'PAID';

              return (
                  <div key={booking.bookingId} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div style={styles.scooterInfo}>
                        <span style={styles.scooterIcon}>🛴</span>
                        <span style={styles.scooterCode}>
                          {booking.scooterName || `车辆 #${booking.scooterId.slice(-4)}`}
                        </span>
                      </div>
                      <span style={styles.badge(statusConfig.color, statusConfig.bg)}>
                    {statusConfig.label}
                  </span>
                      {booking.appliedDiscountType && (
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>折扣原因</span>
                            <span style={styles.infoValue}>{booking.appliedDiscountType}</span>
                          </div>
                      )}
                      {booking.appliedDiscountRate && parseFloat(booking.appliedDiscountRate) > 0 && (
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>折扣力度</span>
                            <span style={{ ...styles.infoValue, color: 'var(--color-primary)' }}>
                              {parseFloat(booking.appliedDiscountRate).toFixed(0)}%
                            </span>
                          </div>
                      )}
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>租赁套餐</span>
                        <span style={styles.infoValue}>{booking.hireType}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>开始时间</span>
                        <span style={styles.infoValue}>{formatDate(booking.startTime)}</span>
                      </div>
                      {booking.endTime && (
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>预计结束</span>
                            <span style={styles.infoValue}>{formatDate(booking.endTime)}</span>
                          </div>
                      )}
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>总费用</span>
                        <span style={styles.priceValue}>{formatPriceFromString(booking.totalCost)}</span>
                      </div>
                      {booking.discountAmount && parseFloat(booking.discountAmount) > 0 && (
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>折扣优惠</span>
                            <span style={{ ...styles.infoValue, color: 'var(--color-accent)' }}>
                        -{formatPriceFromString(booking.discountAmount)}
                      </span>
                          </div>
                      )}
                    </div>

                    {canCancel && (
                        <div style={styles.cardFooter}>
                          <button
                              style={styles.cancelBtn(cancellingId === booking.bookingId)}
                              disabled={cancellingId === booking.bookingId}
                              onClick={() => handleCancel(booking.bookingId)}
                          >
                            {cancellingId === booking.bookingId ? '取消中...' : '取消预订'}
                          </button>
                        </div>
                    )}
                    {canComplete && (
                        <div style={styles.cardFooter}>
                          <button
                              style={styles.completeBtn(completingId === booking.bookingId)}
                              disabled={completingId === booking.bookingId}
                              onClick={() => handleComplete(booking.bookingId)}
                          >
                            {completingId === booking.bookingId ? '结束中...' : '结束行程'}
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

// --- 内联样式字典（保持原风格）---
const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
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
    color: isCancelling ? '#fca5a5' : 'var(--color-accent)',
    backgroundColor: isCancelling ? '#fef2f2' : '#fff1f2',
    border: 'none',
    cursor: isCancelling ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
  }),
  completeBtn: (isCompleting: boolean) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#ffffff',
    backgroundColor: isCompleting ? '#94d8d7' : 'var(--color-primary)',
    border: 'none',
    cursor: isCompleting ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
  }),
};
