// utils/ageUtils.js
// Shared helper for enforcing the 18-100 passenger age rule
// across all sales/customer booking routes (package, tour, transfer, customized).

const MIN_BOOKING_AGE = 18;
const MAX_BOOKING_AGE = 100;

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

// Returns an error message string if the primary passenger fails the 18-100 rule,
// or null if the check passes.
function validatePrimaryPassengerAge(dateOfBirth) {
  const age = calculateAge(dateOfBirth);
  if (age === null) {
    return 'Primary passenger date of birth is required.';
  }
  if (age < MIN_BOOKING_AGE) {
    return `Primary passenger must be at least ${MIN_BOOKING_AGE} years old to book.`;
  }
  if (age > MAX_BOOKING_AGE) {
    return `Primary passenger age cannot exceed ${MAX_BOOKING_AGE} years.`;
  }
  return null;
}

// Validates a single non-primary passenger's DOB against the 18-100 rule.
// Non-primary passengers with no DOB supplied are skipped (DOB is optional for them).
function validatePassengerAge(dateOfBirth, label = 'Passenger') {
  if (!dateOfBirth) return null;
  const age = calculateAge(dateOfBirth);
  if (age === null) {
    return `${label} has an invalid date of birth.`;
  }
  if (age < MIN_BOOKING_AGE) {
    return `${label} must be at least ${MIN_BOOKING_AGE} years old to book.`;
  }
  if (age > MAX_BOOKING_AGE) {
    return `${label} age cannot exceed ${MAX_BOOKING_AGE} years.`;
  }
  return null;
}

// Validates every entry in a passengers[] array (index 0 = primary, already checked
// separately by callers via validatePrimaryPassengerAge). Returns the first error found.
function validatePassengersAge(passengers) {
  if (!Array.isArray(passengers)) return null;
  for (let i = 1; i < passengers.length; i++) {
    const error = validatePassengerAge(passengers[i]?.dateOfBirth, `Passenger ${i + 1}`);
    if (error) return error;
  }
  return null;
}

module.exports = {
  MIN_BOOKING_AGE,
  MAX_BOOKING_AGE,
  calculateAge,
  validatePrimaryPassengerAge,
  validatePassengerAge,
  validatePassengersAge,
};
