// src/utils/format.ts
// 规范要求：货币字段使用“分”为单位，整型 
export const formatPrice = (cents: number): string => {
  return `¥ ${(cents / 100).toFixed(2)}`;
};

// 规范要求：时间格式 ISO8601，统一 UTC [cite: 366]
export const getUTCTimeString = (): string => {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
