// src/api/client.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 满足规范 2.1: Base URL 为 /api/v1
const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json; charset=utf-8', // 满足规范 2.2
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 注入全局 X-Request-Id (规范 6.2)
    config.headers['X-Request-Id'] = uuidv4();

    // 假设我们将 token 存在 localStorage 中
    const token = localStorage.getItem('authToken');
    if (token) {
      // 规范 6.1: 注入 Bearer token
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 直接返回 data 层，因为我们规范的顶层就是 ApiResponse 结构
    return response.data;
  },
  (error) => {
    // 统一错误处理逻辑 (可以将错误抛给页面的 StateWrapper 处理)
    if (error.response) {
      // 处理规范中约定的 401, 403, 404, 409 等状态码
      if (error.response.status === 401) {
        // Token 过期或未登录，清理本地状态并跳转登录
        localStorage.removeItem('authToken');
        window.location.href = '/login'; 
      }
      return Promise.reject(error.response.data); // 返回后端标准错误结构
    }
    return Promise.reject({
      success: false,
      code: 'NETWORK_ERROR',
      message: 'Network connection failed or timeout.',
    });
  }
);

export default apiClient;