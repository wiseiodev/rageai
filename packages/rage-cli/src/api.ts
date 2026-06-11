import type { PublishBatchRequest, PublishRequest, PublishResponse } from '@rageai/core'

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  token?: string,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-api-key': token } : {}),
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json().catch(() => ({}))) as TResponse
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with ${response.status}`
    throw new Error(message)
  }
  return data
}

export async function publishPayload(
  apiUrl: string,
  token: string,
  payload: PublishBatchRequest | PublishRequest,
): Promise<PublishResponse> {
  return postJson<PublishResponse>(`${apiUrl}/api/publish`, payload, token)
}
