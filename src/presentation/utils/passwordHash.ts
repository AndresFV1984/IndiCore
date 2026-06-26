export async function hashPassword(plain: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  if (!plain.trim() || !passwordHash.trim()) return false
  const hashed = await hashPassword(plain.trim())
  return hashed === passwordHash.trim()
}
