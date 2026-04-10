// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { authApi, type RegisterPayload } from '../api';

export const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 表单状态
  const [formData, setFormData] = useState<RegisterPayload>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); // 用户修改输入时清空错误提示
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        // 调用登录 API [cite: 391]
        const res = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem('authToken', res.data.token);
        // TODO: 跳转到车辆浏览页面
        window.location.href = '/scooters';
      } else {
        // 调用注册 API [cite: 390]
        const res = await authApi.register(formData);
        localStorage.setItem('authToken', res.data.token);
        window.location.href = '/scooters';
      }
    } catch (err: unknown) {
        const error = err as { message?: string };
        // 捕获 API 拦截器抛出的标准错误结构 
        setErrorMsg(error.message || '网络或服务器错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* 顶部品牌与标题区 */}
        <div style={styles.header}>
          <div style={styles.logo}>🛴 E-Scooter</div>
          <h2 style={styles.title}>{isLoginMode ? '欢迎回来' : '创建新账号'}</h2>
          <p style={styles.subtitle}>
            {isLoginMode ? '登录以继续您的骑行之旅' : '加入我们，开启绿色出行'}
          </p>
        </div>

        {/* 错误提示区 (使用山茶红) */}
        {errorMsg && (
          <div style={styles.errorBox}>
            <svg style={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 核心表单区 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLoginMode && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>姓名</label>
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="请输入您的真实姓名"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>手机号码</label>
                <input
                  required
                  name="phone"
                  type="tel"
                  placeholder="请输入手机号码"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>电子邮箱</label>
            <input
              required
              name="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              required
              name="password"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* 提交按钮 (使用石绿主色调，自带加载态) */}
          <button type="submit" disabled={loading} style={styles.submitBtn(loading)}>
            {loading ? '处理中...' : (isLoginMode ? '立即登录' : '注册账号')}
          </button>
        </form>

        {/* 模式切换区 */}
        <div style={styles.footer}>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {isLoginMode ? '还没有账号？' : '已经有账号了？'}
          </span>
          <button 
            type="button" 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg('');
            }} 
            style={styles.switchBtn}
          >
            {isLoginMode ? '免费注册' : '直接登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 内联样式字典 (利用全局 CSS 变量) ---
const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    padding: '40px 32px',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    fontSize: '2.5rem',
    marginBottom: '16px',
    color: 'var(--color-primary)', // 石绿 Logo
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--color-text-muted)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff1f2', // 极浅的山茶红背景
    color: 'var(--color-accent)', // 山茶红文字
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  errorIcon: {
    width: '20px',
    height: '20px',
    marginRight: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: (loading: boolean) => ({
    marginTop: '12px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: loading ? '#94d8d7' : 'var(--color-primary)', // 石绿主按钮
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 4px 6px -1px rgba(87, 194, 192, 0.3)', // 石绿阴影
  }),
  footer: {
    marginTop: '32px',
    textAlign: 'center' as const,
    fontSize: '0.9rem',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)', // 石绿文字按钮
    fontWeight: 600,
    marginLeft: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
  }
};