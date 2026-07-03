// utils/bookingValidation.js
// Shared server-side validators for booking routes (email, phone, travel date).
// Frontend already enforces these; this closes the gap where a direct API call
// (bypassing the UI) could submit malformed contact info or a past travel date.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts PH mobile numbers (+63/63/09 prefix, 10 digits after) or a generic
// 8-20 digit international number, matching the loosest pattern already used
// by the frontend forms (Tour: 8-20 digits; Custom: PH-specific).
const PHONE_REGEX = /^(\+?63\d{10}|09\d{9}|\d{8,20})$/;

// Returns an error message string if the email fails format validation,
// or null if it's valid. `required` controls whether an empty value errors.
function validateEmail(email, { required = true, label = 'Email' } = {}) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return required ? `${label} is required.` : null;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return `${label} must be a valid email address.`;
  }
  return null;
}

// Returns an error message string if the phone number fails format validation,
// or null if it's valid. `required` controls whether an empty value errors.
function validatePhone(phone, { required = true, label = 'Phone number' } = {}) {
  const stripped = (phone || '').replace(/[\s\-().]/g, '');
  if (!stripped) {
    return required ? `${label} is required.` : null;
  }
  if (!PHONE_REGEX.test(stripped)) {
    return `${label} must be a valid phone number.`;
  }
  return null;
}

// Returns an error message string if the given date string is before today
// (calendar-day comparison, ignoring time-of-day), or null if it's valid/absent.
function validateNotPastDate(dateValue, label = 'Travel date') {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return `${label} is invalid.`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (date < today) {
    return `${label} cannot be in the past.`;
  }
  return null;
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  validateEmail,
  validatePhone,
  validateNotPastDate,
};
