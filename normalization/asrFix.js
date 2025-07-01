import fs from 'fs/promises';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your API key is set in your environment
});

const skuCatalog = JSON.parse(
  await fs.readFile(`${process.cwd()}/data/skuCatalog.json`)
);

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

let catalogEmbeddings = [];
async function prepareCatalogEmbeddings() {
  catalogEmbeddings = await Promise.all(
    skuCatalog.map(async (item) => ({
      name: item.name,
      embedding: await getEmbedding(item.name)
    }))
  );
}

export async function fixASRErrors(text) {
  if (!text || typeof text !== 'string') return text;
  if (!catalogEmbeddings.length) await prepareCatalogEmbeddings();

  const words = text.toLowerCase().split(' ');
  const fixedWords = await Promise.all(words.map(async (word) => {
    const wordEmbedding = await getEmbedding(word);
    const best = catalogEmbeddings
      .map(item => ({
        name: item.name,
        score: cosineSimilarity(wordEmbedding, item.embedding)
      }))
      .sort((a, b) => b.score - a.score)[0];
    return best && best.score > 0.75 ? best.name : word;
  }));

  return fixedWords.join(' ');
}

export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text
  });
  return response.data[0].embedding;
}

/**
 * Detect potential ASR errors in text
 * @param {string} text - Input text
 * @returns {Array} - Array of detected potential errors
 */
export const detectASRErrors = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const words = text.toLowerCase().split(' ');
  const errors = [];

  words.forEach((word, index) => {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    // Check for known ASR errors
    if (cleanWord && asrErrorMap[cleanWord]) {
      errors.push({
        word: word,
        position: index,
        suggestion: asrErrorMap[cleanWord],
        type: 'asr_error'
      });
    }
    
    // Check for common ASR patterns
    if (cleanWord.match(/^(won|to|too|tree|for|you|are|why|see|sea|bee|be)$/)) {
      errors.push({
        word: word,
        position: index,
        suggestion: asrErrorMap[cleanWord] || word,
        type: 'potential_asr_error'
      });
    }
  });

  return errors;
};

/**
 * Get ASR correction suggestions for a word
 * @param {string} word - Word to get suggestions for
 * @returns {string[]} - Array of correction suggestions
 */
export const getASRCorrections = (word) => {
  if (!word || typeof word !== 'string') {
    return [];
  }

  const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
  const suggestions = [];

  // Direct mapping
  if (cleanWord && asrErrorMap[cleanWord]) {
    suggestions.push(asrErrorMap[cleanWord]);
  }

  // Pattern-based suggestions
  if (cleanWord.includes('phone')) {
    suggestions.push('phone');
  }
  if (cleanWord.includes('laptop')) {
    suggestions.push('laptop');
  }
  if (cleanWord.includes('computer')) {
    suggestions.push('computer');
  }

  return [...new Set(suggestions)]; // Remove duplicates
};

/**
 * Check if text contains potential ASR errors
 * @param {string} text - Text to check
 * @returns {boolean} - True if potential ASR errors detected
 */
export const hasASRErrors = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const errors = detectASRErrors(text);
  return errors.length > 0;
};

export async function normalizeAndMatch(query, topN = 3) {
  if (!catalogEmbeddings.length) await prepareCatalogEmbeddings();
  const normalized = query.trim().toLowerCase();
  const queryEmbedding = await getEmbedding(normalized);

  const matches = catalogEmbeddings
    .map(item => ({
      name: item.name,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return {
    input: query,
    normalized,
    embedding: queryEmbedding,
    bestMatches: matches
  };
} 