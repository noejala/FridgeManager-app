export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpired = (expirationDate: string): boolean => {
  return getDaysUntilExpiration(expirationDate) < 0;
};

export const isExpiringSoon = (expirationDate: string, days: number = 3): boolean => {
  const daysUntil = getDaysUntilExpiration(expirationDate);
  return daysUntil >= 0 && daysUntil <= days;
};
