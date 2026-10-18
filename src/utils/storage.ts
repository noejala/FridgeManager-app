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

// Display a YYYY-MM-DD date unambiguously ("8 Nov 2026" / "8 nov. 2026").
// Parsed as a local date: `new Date('2026-11-08')` is UTC midnight and can show the previous day.
export const formatDate = (dateStr: string, language: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};
