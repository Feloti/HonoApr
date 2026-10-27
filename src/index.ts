import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from 'hono/adapter'
import { HTTPException } from 'hono/http-exception'
import { serve } from '@hono/node-server'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { users, hashPassword, createToken, requireAuth, type AuthEnv } from './auth'
import { fetchNews } from './news'

const app = new Hono<AuthEn2v>()

app.use(logger())
app.use(cors())


const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

const preferencesSchema = z.object({
  category: z.enum(
    ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'],
    'Categoria inválida',
  ),
  country: z.string().regex(/^[a-z]{2}$/, 'Use o código do país com 2 letras minúsculas, ex: br'),
})

function validateJson<T extends z.ZodType>(schema: T) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Dados inválidos', details: z.flattenError(result.error).fieldErrors },
        400,
      )
    }
  })
}


app.post('/register', validateJson(registerSchema), async (c) => {
  const { name, email, password } = c.req.valid('json')

  if (users.has(email)) {
    return c.json({ error: 'E-mail já cadastrado' }, 409)
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hashPassword(password),
    preferences: { category: 'general', country: 'br' },
  }
  users.set(email, user)

  return c.json({ message: 'Usuário criado', user: { id: user.id, name, email } }, 201)
})

app.post('/login', validateJson(loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = users.get(email)
  const passwordHash = await hashPassword(password)
  
  if (!user || user.passwordHash !== passwordHash) {
    return c.json({ error: 'E-mail ou senha incorretos' }, 401)
  }

  return c.json({ token: createToken(email) })
})


app.get('/preferences', requireAuth, (c) => {
  const user = c.get('user')
  return c.json(user.preferences)
})

app.put('/preferences', requireAuth, validateJson(preferencesSchema), (c) => {
  const user = c.get('user')
  user.preferences = c.req.valid('json')
  return c.json({ message: 'Preferências atualizadas', preferences: user.preferences })
})

app.get('/news', requireAuth, async (c) => {
  const user = c.get('user')

  const { NEWS_API_KEY } = env<{ NEWS_API_KEY?: string }>(c)
  if (!NEWS_API_KEY) {
    return c.json({ error: 'NEWS_API_KEY não está configurada no servidor' }, 500)
  }

  try {
    const articles = await fetchNews(user.preferences, NEWS_API_KEY)
    return c.json({ preferences: user.preferences, total: articles.length, articles })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Falha ao consultar a API de notícias' }, 502)
  }
})


app.notFound((c) => c.json({ error: 'Rota não encontrada' }, 404))

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Erro interno do servidor' }, 500)
})

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Servidor rodando em http://localhost:${info.port}`)
})
