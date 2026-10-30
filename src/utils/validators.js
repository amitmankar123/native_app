/**
 * Email format validator
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Mobile number validator (Indian standard 10-digit or with +91)
 */
export function isValidMobile(mobile) {
  if (!mobile) return true; // optional
  const cleaned = mobile.replace(/[\s-]/g, '');
  const regex = /^(\+91)?[6-9]\d{9}$/;
  return regex.test(cleaned);
}

/**
 * Strong password checker with score (0 - 4)
 */
export function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'Empty', color: '#9CA3AF' };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: '#EF4444' };
    case 2:
      return { score: 2, label: 'Fair', color: '#F59E0B' };
    case 3:
      return { score: 3, label: 'Good', color: '#3B82F6' };
    case 4:
      return { score: 4, label: 'Strong', color: '#10B981' };
    default:
      return { score: 0, label: 'Too short', color: '#EF4444' };
  }
}

