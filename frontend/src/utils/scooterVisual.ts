import type { Scooter } from '../types';

const colors = ['#0f766e', '#1d4ed8', '#ea580c', '#7c3aed', '#be123c'];

const pickColor = (seed: string): string => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const encodeSvg = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getScooterImage = (scooter: Partial<Scooter>): string => {
  if (scooter.imageUrl) {
    return scooter.imageUrl;
  }

  const color = pickColor(scooter.code || scooter.model || 'scooter');
  const label = scooter.code || scooter.model || 'E-Scooter';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${color}" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="28" fill="url(#g)" />
      <circle cx="210" cy="300" r="44" fill="#f8fafc" fill-opacity="0.9" />
      <circle cx="450" cy="300" r="44" fill="#f8fafc" fill-opacity="0.9" />
      <path d="M210 300h130l44-140h24l20 24h40" fill="none" stroke="#f8fafc" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M302 160l-28 86h-70" fill="none" stroke="#f8fafc" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
      <text x="44" y="72" font-size="24" font-family="Trebuchet MS, Segoe UI, sans-serif" fill="#f8fafc" opacity="0.8">SPRINT 3 PREVIEW</text>
      <text x="44" y="356" font-size="38" font-weight="700" font-family="Trebuchet MS, Segoe UI, sans-serif" fill="#ffffff">${label}</text>
    </svg>
  `;

  return encodeSvg(svg);
};

export const getScooterSpecs = (scooter: Partial<Scooter>) => {
  return {
    topSpeedKph: scooter.topSpeedKph ?? 28,
    rangeKm: scooter.rangeKm ?? 45,
    motorPowerW: scooter.motorPowerW ?? 500,
    batteryLevel: scooter.batteryLevel ?? 82,
    performanceNote:
      scooter.performanceNote ??
      'Balanced city setup for short commute demos, smooth acceleration, and reliable battery feedback.',
  };
};
