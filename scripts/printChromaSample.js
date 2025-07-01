import ChromaVectorDBService from "../services/chromaVectorDBService.js";

async function main() {
  const chroma = new ChromaVectorDBService();
  await chroma.initializeCollection();

  // Print collection stats
  const stats = await chroma.getCollectionStats();
  console.log("--- Chroma Collection Stats ---");
  console.log(stats);

  // Get sample IDs (if available)
  const sampleIds = stats.sampleIds?.slice(0, 10) || [];
  if (sampleIds.length === 0) {
    console.log("No SKUs found in the collection.");
    return;
  }

  // Fetch sample SKUs
  const skus = await chroma.getSKUs(sampleIds);
  console.log(`\n--- Sample SKUs (${skus.length}) ---`);
  skus.forEach((sku, i) => {
    console.log(`\n[${i + 1}] SKU ID: ${sku.id}`);
    console.log("Metadata:", sku.metadata);
    console.log("Document:", sku.document);
  });
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
