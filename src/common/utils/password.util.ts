import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain password using bcrypt with a fixed salt rounds.
 * Use this everywhere a password must be stored so SALT_ROUNDS is consistent.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
