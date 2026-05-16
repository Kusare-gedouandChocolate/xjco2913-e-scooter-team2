import type { Scooter } from '../types';

import scooter1Img from '../assets/scooter1.jpg';
import scooter2Img from '../assets/scooter2.jpg';
import scooter3Img from '../assets/scooter3.jpg';

export const getScooterImage = (scooter: Partial<Scooter>): string => {
  if (scooter.imageUrl) {
    return scooter.imageUrl;
  }

  const images = [scooter1Img, scooter2Img, scooter3Img];
  const seed = scooter.code || scooter.model || 'scooter';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
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
