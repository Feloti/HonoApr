import type { Preferences } from './auth'

type NewsApiResponse = {
  articles: {
    title: string
    description: string | null
    url: string
    publishedAt: string
    source: { name: string }
  }[]
}

export async function fetchNews(preferences: Preferences, apiKey: string) {
  const url = new URL('https://newsapi.org/v2/top-headlines')
  url.searchParams.set('country', preferences.country)
  url.searchParams.set('category', preferences.category)
  url.searchParams.set('pageSize', '5')

  const response = await fetch(url, {
    headers: { 'X-Api-Key': apiKey },
  })

  if (!response.ok) {
    throw new Error(`NewsAPI respondeu com status ${response.status}`)
  }

  const data = (await response.json()) as NewsApiResponse

  return data.articles.map((article) => ({
    title: article.title,
    description: article.description,
    source: article.source.name,
    url: article.url,
    publishedAt: article.publishedAt,
  }))
}
