export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const clientId     = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing env vars ML_CLIENT_ID / ML_CLIENT_SECRET' });
  }

  try {
    const r = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     clientId,
        client_secret: clientSecret,
        code:          code,
        redirect_uri:  'https://ml-chofer-beta.vercel.app/'
      })
    });

    const data = await r.json();
    return res.status(r.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
