const RESERVED_USERNAMES = new Set([
  "vault",
  "login",
  "register",
  "admin",
  "api",
  "auth",
  "root",
  "settings",
  "profile",
  "demo",
  "about",
  "contact",
  "privacy",
  "terms",
  "help",
  "support",
  "explore",
  "search",
]);

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt practical max bytes

const USERNAME_REGEX = /^(?=.{3,15}$)[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/;
const USERNAME_IDENTIFIER_REGEX = /^[a-z0-9._]+$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInIdentifierCandidates = {
  email?: string;
  username?: string;
};

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return SIMPLE_EMAIL_REGEX.test(email);
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username);
}

export function validateUsername(rawUsername: string): string | null {
  const username = normalizeUsername(rawUsername);

  if (!username) return "Username is required";
  if (!USERNAME_REGEX.test(username)) {
    return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and use only letters, numbers, periods, or underscores (no spaces).`;
  }
  if (isReservedUsername(username)) return "This username is reserved and cannot be used";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export function parseSignInIdentifier(rawIdentifier: string): SignInIdentifierCandidates {
  const identifier = rawIdentifier.trim();
  const candidates: SignInIdentifierCandidates = {};

  if (!identifier) return candidates;

  const normalizedEmail = normalizeEmail(identifier);
  if (isValidEmail(normalizedEmail)) {
    candidates.email = normalizedEmail;
  }

  const normalizedUsername = normalizeUsername(identifier);
  if (
    normalizedUsername.length >= USERNAME_MIN_LENGTH &&
    normalizedUsername.length <= USERNAME_MAX_LENGTH &&
    USERNAME_IDENTIFIER_REGEX.test(normalizedUsername)
  ) {
    candidates.username = normalizedUsername;
  }

  return candidates;
}

export function hasAtLeastOneIdentifierCandidate(
  candidates: SignInIdentifierCandidates
): boolean {
  return Boolean(candidates.email || candidates.username);
}
