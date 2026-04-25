const normalizeCents = (value?: number | string | null): number => {
  if (value == null || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPrice = (cents: number | string | null | undefined): string => {
  return `£${(normalizeCents(cents) / 100).toFixed(2)}`;
};

export const formatPercent = (value?: number | string | null): string => {
  const normalized = normalizeCents(value);
  return `${normalized.toFixed(0)}%`;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getUTCTimeString = (): string => {
  return new Date().toISOString();
};

export const getBatteryDelta = (checkout?: number, returned?: number): number => {
  if (checkout == null || returned == null) {
    return 0;
  }

  return Math.max(0, checkout - returned);
};
