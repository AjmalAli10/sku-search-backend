import fs from 'fs/promises';
import { correctSpelling } from '../spellcheck.js';
import { fixASRErrors } from '../asrFix.js';
import { getBestCategoryMatches } from '../synonymMap.js';

const skuCatalog = JSON.parse(
  await fs.readFile(`${process.cwd()}/data/skuCatalog.json`)
); 

export async function normalizeAndMatch(query, topN = 3) {
  if (!query || typeof query !== 'string') {
    return {
      input: query,
      normalized: query,
      embedding: [],
      bestMatches: []
    };
  }
  // Step 1: ASR Fix (embedding-based)
  let normalized = await fixASRErrors(query);
  // Step 2: Spellcheck (embedding-based)
  normalized = await correctSpelling(normalized);
  // Step 3: Get embedding and best matches
  const { matches, embedding } = await getBestCategoryMatches(normalized, topN, true);
  return {
    input: query,
    normalized,
    embedding,
    bestMatches: matches
  };
} 