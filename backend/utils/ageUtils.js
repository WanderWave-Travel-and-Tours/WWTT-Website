// utils/ageUtils.js
// Shared helper for enforcing the 18+ primary-passenger booking rule
// across all sales/customer booking routes (package, tour, transfer, customized).

const MIN_BOOKING_AGE = 18;

// Computes age in whole years from a "YYYY-MM-DD" (or any Date-parsable) birthdate.
// Returns null if the input can't be parsed into a valid date.
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Returns an error message string if the primary passenger fails the 18+ rule,
// or null if the check passes.
function validatePrimaryPassengerAge(dateOfBirth) {
  const age = calculateAge(dateOfBirth);
  if (age === null) {
    return 'Primary passenger date of birth is required.';
  }
  if (age < MIN_BOOKING_AGE) {
    return `Primary passenger must be at least ${MIN_BOOKING_AGE} years old to book.`;
  }
  return null;
}

module.exports = { MIN_BOOKING_AGE, calculateAge, validatePrimaryPassengerAge };
