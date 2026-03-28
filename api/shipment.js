export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  let accessToken = process.env.ML_ACCESS_TOKEN;
  const refreshToken = process.env.ML_REFRESH_TOKEN;

  async function fetchShipment(token) {
    return fetch(`https://api.mercadolibre.com/shipments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function doRefresh() {
    const r = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    return r.json();
  }

  try {
    let r = await fetchShipment(accessToken);

    if (r.status === 401) {
      const refreshed = await doRefresh();
      if (refreshed.access_token) {
        accessToken = refreshed.access_token;
        r = await fetchShipment(accessToken);
      }
    }

    if (!r.ok) {
      const err = await r.json();
      return res
        .status(r.status)
        .json({ error: err.message || "ML API error" });
    }

    const ship = await r.json();
    const addr = ship.receiver_address || {};

    const zip = addr.zip_code || "";
    const city =
      addr.city?.name ||
      addr.municipality?.name ||
      addr.neighborhood?.name ||
      "";
    const street = addr.street_name || "";
    const number = addr.street_number || "";
    const state = addr.state?.name || "";

    return res.status(200).json({ zip, city, street, number, state });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
