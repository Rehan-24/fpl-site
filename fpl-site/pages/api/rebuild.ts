import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const r = await fetch(`https://tfpl.onrender.com/api/admin/rebuild?league=${encodeURIComponent(String(req.query.league || "premier"))}`, {
      method: "POST",
      headers: { "X-Api-Key": process.env.API_KEY as string },
    });
    const j = await r.json();
    res.status(r.ok ? 200 : 500).json(j);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "proxy error" });
  }
}
