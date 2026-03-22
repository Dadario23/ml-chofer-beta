export default async function handler(req, res) {
  // CORS headers so the browser can call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const r = await fetch(`https://api.mercadolibre.com/shipments/${id}`, {
      headers: { 'User-Agent': 'ml-chofer-app/1.0' }
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: `ML API error: ${r.status}` });
    }

    const ship = await r.json();
    const addr = ship.receiver_address || {};

    // Extract the fields we need
    const zip    = addr.zip_code || '';
    const city   = addr.city?.name || addr.municipality?.name || addr.neighborhood?.name || '';
    const street = addr.street_name || '';
    const number = addr.street_number || '';
    const state  = addr.state?.name || '';

    return res.status(200).json({ zip, city, street, number, state });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
