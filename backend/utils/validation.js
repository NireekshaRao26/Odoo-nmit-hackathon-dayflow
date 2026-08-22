/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: >= 8 characters, >= 1 uppercase, >= 1 lowercase, >= 1 digit, >= 1 special character
 * @param {string} password 
 * @returns {boolean}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

/**
 * Validate employee ID format
 * Requirements: alphanumeric, dashes, underscores, between 3 and 20 characters
 * @param {string} employeeId 
 * @returns {boolean}
 */
function validateEmployeeId(employeeId) {
  if (!employeeId || typeof employeeId !== 'string') return false;
  // Allows alphanumeric characters, dashes, and underscores, 3-20 chars
  const empIdRegex = /^[a-zA-Z0-9-_]{3,20}$/;
  return empIdRegex.test(employeeId);
}

/**
 * Validate role
 * Requirements: must be exactly 'employee' or 'hr'
 * @param {string} role 
 * @returns {boolean}
 */
function validateRole(role) {
  if (!role || typeof role !== 'string') return false;
  return role === 'employee' || role === 'hr';
}

module.exports = {
  validateEmail,
  validatePassword,
  validateEmployeeId,
  validateRole
};
