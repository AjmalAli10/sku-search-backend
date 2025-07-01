import fs from "fs/promises";
import OpenAI from "openai";

// Initialize OpenAI client lazily
let openai = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Make sure your API key is set in your environment
    });
  }
  return openai;
}

// Load SKU catalog lazily
let skuCatalog = null;
async function getSkuCatalog() {
  if (!skuCatalog) {
    skuCatalog = JSON.parse(
      await fs.readFile(`${process.cwd()}/data/skuCatalog.json`)
    );
  }
  return skuCatalog;
}

// Helper: Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Precompute catalog embeddings (ideally, store in DB/file for performance)
let catalogEmbeddings = [];
async function prepareCatalogEmbeddings() {
  if (catalogEmbeddings.length === 0) {
    const catalog = await getSkuCatalog();
    catalogEmbeddings = await Promise.all(
      catalog.map(async (item) => ({
        name: item.name,
        embedding: await getEmbedding(item.name),
      }))
    );
  }
}

// Main function: AI-based spellcheck (returns best match from catalog)
export async function correctSpelling(text) {
  if (!text || typeof text !== "string") return text;
  await prepareCatalogEmbeddings();

  const words = text.toLowerCase().split(" ");
  const correctedWords = await Promise.all(
    words.map(async (word) => {
      const wordEmbedding = await getEmbedding(word);
      // Find best match in catalog
      const best = catalogEmbeddings
        .map((item) => ({
          name: item.name,
          score: cosineSimilarity(wordEmbedding, item.embedding),
        }))
        .sort((a, b) => b.score - a.score)[0];
      // If similarity is high enough, use catalog word, else keep original
      return best && best.score > 0.75 ? best.name : word;
    })
  );

  return correctedWords.join(" ");
}

export async function getSpellingSuggestions(word, limit = 3) {
  if (!word || typeof word !== "string") return [];
  await prepareCatalogEmbeddings();
  const wordEmbedding = await getEmbedding(word);
  return catalogEmbeddings
    .map((item) => ({
      name: item.name,
      score: cosineSimilarity(wordEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.name);
}

export async function isCorrectlySpelled(word) {
  if (!word || typeof word !== "string") return false;
  await prepareCatalogEmbeddings();
  const wordEmbedding = await getEmbedding(word);
  const best = catalogEmbeddings
    .map((item) => ({
      name: item.name,
      score: cosineSimilarity(wordEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0.9;
}

export async function getEmbedding(text) {
  const openaiClient = getOpenAI();
  const response = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}
