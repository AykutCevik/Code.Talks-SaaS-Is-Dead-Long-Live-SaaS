// Helper to create mock Next.js request objects for testing
export function createMockRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
  url?: string;
}) {
  const { method = 'GET', body, headers = {}, searchParams = {}, url = 'http://localhost:3000' } = options;
  
  const requestUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    requestUrl.searchParams.set(key, value);
  });

  const request = {
    method,
    headers: new Headers(headers),
    nextUrl: requestUrl,
    json: async () => body,
    signal: new AbortController().signal,
  } as any;

  return request;
}

export async function waitForServer(url: string, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not start in time');
}

