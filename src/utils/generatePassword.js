const crypto = require('crypto');

/**
 * Generates a secure random password that satisfies common complexity rules:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * - Configurable total length (default 12)
 *
 * Example output: "Kx9#mP2$qLn7"
 */
const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // no I, O (confusing)
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';     // no i, l, o
  const digits    = '23456789';                     // no 0, 1 (confusing)
  const special   = '@#$%&*!';
  const all       = uppercase + lowercase + digits + special;

  // Guarantee at least one of each class
  const guaranteed = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  // Fill remaining characters randomly
  const remaining = Array.from(
    { length: length - guaranteed.length },
    () => all[crypto.randomInt(all.length)]
  );

  // Shuffle everything so guaranteed chars aren't always at the start
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
};

module.exports = { generatePassword };