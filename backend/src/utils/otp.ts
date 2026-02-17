export const generateOtp = (): string => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const getOtpExpiry = (): string => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  return expiresAt.toISOString();
};

export const isOtpExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() < Date.now();
};
