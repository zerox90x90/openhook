export function captureHeaders(raw: Request): Record<string, string> {
  const headers: Record<string, string> = {}
  raw.headers.forEach((value, key) => {
    headers[key] = value
  })
  return headers
}

export function captureQuery(url: URL): Record<string, string> {
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

const MAX_BODY_SIZE = 1_500_000

export async function captureBody(raw: Request): Promise<string> {
  try {
    const text = await raw.text()
    if (text.length > MAX_BODY_SIZE) {
      return text.slice(0, MAX_BODY_SIZE) + '\n\n[TRUNCATED - body exceeded 1.5MB limit]'
    }
    return text
  } catch {
    return '[unable to read body]'
  }
}
