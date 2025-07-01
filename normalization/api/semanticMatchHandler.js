import { normalizeAndMatch } from '../index.js';

export const semanticMatchHandler = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // AI/embedding-based normalization (ASR fix, spellcheck, best match)
    const result = await normalizeAndMatch(query);

    res.json(result);
  } catch (error) {
    next(error);
  }
}; 