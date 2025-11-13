/**
 * Validate email
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Vietnamese)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object}
 */
export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  const strength = [minLength, hasUpperCase, hasLowerCase, hasNumber].filter(Boolean).length;
  
  return {
    isValid: minLength && strength >= 3,
    strength: strength === 4 ? 'strong' : strength === 3 ? 'medium' : 'weak',
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
  };
};

/**
 * Validate required field
 * @param {any} value
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate number range
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const isInRange = (value, min, max) => {
  return value >= min && value <= max;
};

