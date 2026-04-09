// src/pages/ReportPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { reportsApi } from '../api';
import type { WeeklyIncomeReport } from '../types';
import { StateWrapper } from '../components/StateWrapper';
import { formatPrice } from '../utils/format';

// --- 图表配色方案 ---
const COLORS = ['#57c2c0', '#38bdf8', '#818cf8', '#fd4569', '#f59e0b'];

export const ReportPage: React.FC = () => {
  // 默认查询 2026-03-23 这一周（对应你们 Sprint 2 的 Mock 数据）
  const [weekStart, setWeekStart] = useState<string>('2026-03-23');
  const [report, setReport] = useState<WeeklyIncomeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getWeeklyIncome(weekStart);
      setReport(res.data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || '获取报表数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // 将后端返回的“分”转换为“元”，方便图表展示
  const chartData = report?.items.map(item => ({
    name: `${item.hireType} 套餐`,
    income: item.incomeInCents / 100, // 转换为元
  })) || [];

  // 图表自定义提示框 (Tooltip)
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltipBox}>
          <p style={styles.tooltipLabel}>{label}</p>
          <p style={styles.tooltipValue}>
            收入: <strong>{formatPrice(payload[0].value * 100)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.8rem', marginBottom: '8px' }}>
            📊 收入统计概览
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>查看系统近期的运营收入与套餐分布</p>
        </div>
        
        {/* 日期筛选器 */}
        <div style={styles.filterBox}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>选择周起始日：</label>
          <input 
            type="date" 
            value={weekStart} 
            onChange={(e) => setWeekStart(e.target.value)}
            style={styles.dateInput}
          />
        </div>
      </header>

      <StateWrapper 
        loading={loading} 
        error={error} 
        empty={!report || report.items.length === 0}
        emptyMessage="该周暂无收入数据"
        onRetry={fetchReport}
      >
        {report && (
          <div style={styles.dashboard}>
            {/* 顶部：核心指标卡片 (KPI) */}
            <div style={styles.kpiRow}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>当前统计周期</span>
                <span style={styles.kpiValueText}>
                  {report.weekStart} <br/> <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>至 {report.weekEnd}</span>
                </span>
              </div>
              <div style={{...styles.kpiCard, backgroundColor: 'var(--color-primary)', color: '#fff'}}>
                <span style={{...styles.kpiLabel, color: '#e6f7f6'}}>周期总收入 (Gross Income)</span>
                <span style={{...styles.kpiValue, color: '#fff'}}>
                  {formatPrice(report.totalIncomeInCents)}
                </span>
              </div>
            </div>

            {/* 下方：图表矩阵 */}
            <div style={styles.chartsGrid}>
              
              {/* 左侧：柱状对比图 */}
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>各套餐收入对比</h3>
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} tickFormatter={(val) => `¥${val}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 右侧：收入占比饼图 */}
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>收入来源占比</h3>
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="income"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}
      </StateWrapper>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--color-surface)',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    fontSize: '0.95rem',
    color: 'var(--color-text-main)',
    outline: 'none',
  },
  dashboard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  kpiCard: {
    backgroundColor: 'var(--color-surface)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  kpiLabel: {
    fontSize: '0.95rem',
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: 'var(--color-text-main)',
  },
  kpiValueText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
    lineHeight: '1.4',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: 'var(--color-surface)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  chartTitle: {
    fontSize: '1.1rem',
    color: 'var(--color-text-main)',
    marginBottom: '20px',
  },
  chartWrapper: {
    width: '100%',
    height: '350px',
  },
  tooltipBox: {
    backgroundColor: '#fff',
    border: '1px solid var(--color-border)',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
  },
  tooltipLabel: {
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
  },
  tooltipValue: {
    color: 'var(--color-primary)',
    fontSize: '1.1rem',
  }
};