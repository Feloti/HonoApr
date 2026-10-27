import { createMiddleware } from 'hono/factory'

export type Preferences = {
  category: string
  country: string
}

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  preferences: Preferences
}

export const users = new Map<string, User>() 
const tokens = new Map<string, string>() 

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createToken(email: string): string {
  const token = crypto.randomUUID()
  tokens.set(token, email)
  return token
}

export type AuthEnv = {
  Variables: { user: User }
}

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization')

  if (!header || !header.startsWith('Bearer ')) {
    return c.json({ error: 'Token não informado' }, 401)
  }

  const token = header.slice('Bearer '.length)
  const email = tokens.get(token)
  const user = email ? users.get(email) : undefined

  if (!user) {
    return c.json({ error: 'Token inválido' }, 401)
  }

  c.set('user', user)
  await next()
})
