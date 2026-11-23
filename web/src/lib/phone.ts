// Turns what a person types into an E.164 number (for example +15035550123).
// Bare 10-digit and 1-prefixed US numbers are read as US numbers.
// Returns null when the input can't be a valid phone number.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return null;

  let e164: string;
  if (trimmed.startsWith('+')) {
    e164 = `+${digits}`;
  } else if (digits.length === 10) {
    e164 = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    e164 = `+${digits}`;
  } else {
    return null;
  }

  // E.164: up to 15 digits in total, with a leading country code.
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}
