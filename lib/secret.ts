/** Single place that resolves the JWT signing secret (works in proxy + route handlers). */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return new TextEncoder().encode(secret || 'your-super-secret-jwt-key');
}
