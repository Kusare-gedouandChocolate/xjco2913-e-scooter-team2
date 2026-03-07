// src/components/StateWrapper.tsx
import React, { ReactNode } from 'react';

// 定义组件的 Props 契约
interface StateWrapperProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export const StateWrapper: React.FC<StateWrapperProps> = ({
  loading,
  error,
  empty,
  emptyMessage = '暂无数据',
  onRetry,
  children,
}) => {
  // 1. 加载态：石绿主题色旋转动画
  if (loading) {
    return (
      <div style={styles.container}>
        <svg
          style={styles.spinner}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            style={{ opacity: 0.25 }}
          ></circle>
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginTop: '12px' }}>
          正在加载中...
        </p>
      </div>
    );
  }

  // 2. 错误态：山茶红警示色及重试交互
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorIcon}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 style={{ color: 'var(--color-accent)', marginBottom: '8px' }}>加载失败</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', maxWidth: '300px' }}>
          {error}
        </p>
        {onRetry && (
          <button style={styles.retryBtn} onClick={onRetry}>
            重新尝试
          </button>
        )}
      </div>
    );
  }

  // 3. 空数据态：现代感极简占位图
  if (empty) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyBox}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  // 4. 正常态：渲染实际页面内容
  return <>{children}</>;
};

// 内部样式表 (充分利用之前定义的 CSS 变量)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    margin: '16px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    color: 'var(--color-primary)', // 石绿
    animation: 'spin 1s linear infinite',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    color: 'var(--color-accent)', // 山茶红
    marginBottom: '12px',
  },
  emptyBox: {
    width: '64px',
    height: '64px',
    color: '#cbd5e1',
    marginBottom: '16px',
  },
  retryBtn: {
    padding: '8px 24px',
    backgroundColor: 'var(--color-accent)', // 山茶红按钮
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  }
};

// 为了让 SVG 动起来，在文件末尾注入一个极简的全局动画
const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = spinKeyframes;
  document.head.appendChild(styleSheet);
}