import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

const KIMBU_BASE_URL = process.env.KIMBU_BASE_URL ?? 'https://api.kimbu.cslade.space';
const KIMBU_APP_ID   = process.env.KIMBU_APP_ID ?? '';

async function introspect(token: string): Promise<boolean> {
  const res = await fetch(`${KIMBU_BASE_URL}/v1/auth/introspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return false;
  const data = await res.json() as { active?: boolean };
  return data.active === true;
}

export const setBadgeOverrides = onRequest(
  { cors: ['https://cslade.space', 'https://portfolio-dae1f.web.app', 'http://localhost:3000'] },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) { res.status(401).json({ error: 'Missing token' }); return; }

    const valid = await introspect(token);
    if (!valid) { res.status(401).json({ error: 'Invalid or expired token' }); return; }

    const { overrides } = req.body as { overrides?: Record<string, string[]> };
    if (!overrides || typeof overrides !== 'object') {
      res.status(400).json({ error: 'Missing overrides' });
      return;
    }

    // Validate: values must be arrays of strings
    for (const [key, val] of Object.entries(overrides)) {
      if (!Array.isArray(val) || val.some(v => typeof v !== 'string')) {
        res.status(400).json({ error: `Invalid badges for project "${key}"` });
        return;
      }
    }

    await db.collection('portfolio').doc('badge-overrides').set(
      { overrides, updatedAt: admin.firestore.FieldValue.serverTimestamp(), appId: KIMBU_APP_ID },
      { merge: false }
    );

    res.status(200).json({ ok: true });
  }
);

export const getBadgeOverrides = onRequest(
  { cors: true },
  async (_req, res) => {
    const snap = await db.collection('portfolio').doc('badge-overrides').get();
    if (!snap.exists) { res.status(200).json({ overrides: {} }); return; }
    const data = snap.data() as { overrides: Record<string, string[]> };
    res.status(200).json({ overrides: data.overrides ?? {} });
  }
);
