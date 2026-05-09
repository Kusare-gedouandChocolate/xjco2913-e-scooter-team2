import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { reportsApi } from '../api';
import { StateWrapper } from '../components/StateWrapper';
import type { RevenueByHireTypeResponse, WeeklyRevenueStatisticsResponse } from '../types';
import { formatPrice } from '../utils/format';

const COLORS = ['#57c2c0', '#38bdf8', '#818cf8', '#fd4569', '#f59e0b'];

const getCurrentWeekStart = (): string => {
  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return monday.toISOString().split('T')[0];
};

export const ReportPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart());
  const [report, setReport] = useState<WeeklyRevenueStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const res = await reportsApi.getWeeklyRevenue(startDate, endDate, weekStart);
      setReport(res.data);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [weekStart]);

  const selectedWeekData = report?.selectedWeek ?? report?.weeklyRevenue?.[0];

  const chartData: { name: string; income: number }[] =
    selectedWeekData?.revenueByHireType?.map((item: RevenueByHireTypeResponse) => ({
      name: `${item.hireType} package`,
      income: parseFloat(item.revenue) || 0,
    })) || [];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltipBox}>
          <p style={styles.tooltipLabel}>{label}</p>
          <p style={styles.tooltipValue}>
            Income: <strong>{formatPrice(payload[0].value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalRevenue = report?.totalRevenue
    ? (parseFloat(report.totalRevenue) || 0) / 100
    : chartData.reduce((sum, item) => sum + item.income, 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.8rem', marginBottom: '8px' }}>
            Revenue Overview
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Review recent operating revenue and package distribution.
          </p>
        </div>

        <div style={styles.filterBox}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }} htmlFor="week-start">
            Select week start:
          </label>
          <input
            id="week-start"
            type="date"
            value={weekStart}
            onChange={(event) => setWeekStart(event.target.value)}
            style={styles.dateInput}
          />
        </div>
      </header>

      <StateWrapper
        loading={loading}
        error={error}
        empty={!report || report.empty || !selectedWeekData}
        emptyMessage="No revenue data is available for this week."
        onRetry={fetchReport}
      >
        {report && selectedWeekData && (
          <div style={styles.dashboard}>
            <div style={styles.kpiRow}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Reporting period</span>
                <span style={styles.kpiValueText}>
                  {selectedWeekData.weekStart}
                  <br />
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                    to {selectedWeekData.weekEnd}
                  </span>
                </span>
              </div>
              <div style={{ ...styles.kpiCard, backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                <span style={{ ...styles.kpiLabel, color: '#e6f7f6' }}>Gross income</span>
                <span style={{ ...styles.kpiValue, color: '#fff' }}>
                  {formatPrice(totalRevenue)}
                </span>
              </div>
            </div>

            <div style={styles.chartsGrid}>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Revenue by package</h3>
                <div style={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--color-text-muted)' }}
                        tickFormatter={(value) => formatPrice(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Revenue share</h3>
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
  },
};

export default ReportPage;
