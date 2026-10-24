// Password helpers shared by SignUp and ResetPassword.

// Rule: at least 8 characters, with at least one letter (Latin or Arabic) and one digit.
export function isStrongEnough(password) {
  return (
    password.length >= 8 &&
    /[A-Za-z؀-ۿ]/.test(password) &&
    /\d/.test(password)
  );
}

// Checks a password against HaveIBeenPwned using k-anonymity:
// only the first 5 chars of the SHA-1 hash leave the browser.
// Fails open (returns false) if the service is unreachable.
export async function isPwned(password) {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return false;
    const text = await res.text();
    return text.split('\n').some((line) => {
      const [h, count] = line.trim().split(':');
      return h === suffix && parseInt(count, 10) > 0;
    });
  } catch {
    return false;
  }
}
