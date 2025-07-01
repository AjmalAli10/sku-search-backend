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

// Main function: Get best matches for a query
export async function getBestCategoryMatches(
  query,
  topN = 3,
  returnEmbedding = false
) {
  await prepareCatalogEmbeddings();
  const queryEmbedding = await getEmbedding(query);

  const matches = catalogEmbeddings
    .map((item) => ({
      name: item.name,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  if (returnEmbedding) {
    return { matches, embedding: queryEmbedding };
  }
  return matches;
}

export async function getEmbedding(text) {
  const openaiClient = getOpenAI();
  const response = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}
