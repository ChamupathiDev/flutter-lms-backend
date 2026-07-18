import {
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

import { environment } from '../config/environment';

export const hashToken = (
  value: string,
): string => {
  return createHash('sha256')
    .update(value)
    .digest('hex');
};

export const hashOtp = (
  value: string,
): string => {
  return createHmac(
    'sha256',
    environment.OTP_PEPPER,
  )
    .update(value)
    .digest('hex');
};

export const safeHashEquals = (
  firstHash: string,
  secondHash: string,
): boolean => {
  const firstBuffer =
    Buffer.from(firstHash, 'hex');

  const secondBuffer =
    Buffer.from(secondHash, 'hex');

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer,
  );
};