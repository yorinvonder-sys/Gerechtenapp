export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Pexels API key not configured" });
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    const data = await response.json();
    const imageUrl = data.photos?.[0]?.src?.large || data.photos?.[0]?.src?.medium || null;

    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).json({ url: imageUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
