/**
 * Vercel Serverless Function — /api/send-email
 *
 * Acts as a secure server-side proxy to Resend.
 * - API key stays on the server (no VITE_ prefix needed)
 * - RESEND_TO_EMAIL overrides the recipient for Resend's sandbox restriction
 * - Called by the frontend via POST /api/send-email
 */
export default async function handler(req, res) {
  // Allow same-origin + local dev calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY env var not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, subject, html } = req.body || {};

  // RESEND_TO_EMAIL hard-overrides recipient (required for onboarding@resend.dev sandbox)
  const recipient = process.env.RESEND_TO_EMAIL || to;

  if (!recipient) {
    return res.status(400).json({ error: 'No recipient email provided' });
  }
  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing subject or html' });
  }

  console.log(`[send-email] Sending to: ${recipient} | Subject: ${subject}`);

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SleekHabits <onboarding@resend.dev>',
        to: [recipient],
        subject,
        html,
      }),
    });

    const data = await resendRes.json();

    if (!resendRes.ok) {
      console.error('[send-email] Resend error:', data);
      return res.status(resendRes.status).json({ error: data });
    }

    console.log('[send-email] Sent successfully. ID:', data.id);
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('[send-email] Fetch failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
