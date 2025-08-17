
import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { owner } = req.query
  try {
    const r = await fetch(`${BACKEND}/managers/owner/${owner}/fixtures`)
    const j = await r.json()
    res.status(200).json(j)
  } catch (e) {
    res.status(200).json({ fixtures: [] })
  }
}
