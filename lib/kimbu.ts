const BASE = 'https://api.kimbu.cslade.space';
const APP_ID = process.env.NEXT_PUBLIC_KIMBU_APP_ID ?? '';

export interface KimbuTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function kimbuLogin(email: string, password: string): Promise<KimbuTokens> {
  const res = await fetch(`${BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-ID': APP_ID },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Login failed (${res.status})`);
  }
  const data = await res.json() as { tokens: KimbuTokens };
  return data.tokens;
}

export async function kimbuRefresh(refreshToken: string): Promise<KimbuTokens> {
  const res = await fetch(`${BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Session expired');
  const data = await res.json() as { tokens: KimbuTokens };
  return data.tokens;
}
