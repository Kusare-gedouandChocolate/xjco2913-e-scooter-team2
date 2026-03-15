// src/utils/format.ts
// 规范要求：货币字段使用“分”为单位，整型 
export const formatPrice = (cents: number): string => {
  return `¥ ${(cents / 100).toFixed(2)}`;
};

// 规范要求：时间格式 ISO8601，统一 UTC [cite: 366]
export const getUTCTimeString = (): string => {
  return new Date().toISOString(); 
};