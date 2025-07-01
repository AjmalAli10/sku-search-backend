import dotenv from "dotenv";
import ChromaVectorDBService from "../services/chromaVectorDBService.js";
import EmbeddingService from "../services/embeddingService.js";

// Load environment variables
dotenv.config();

async function testChromaIntegration() {
  try {
    console.log("🧪 Testing Chroma Integration...");

    // Initialize services
    const chromaService = new ChromaVectorDBService();
    const embeddingService = new EmbeddingService();

    // Test 1: Initialize collection
    console.log("\n1️⃣ Testing collection initialization...");
    await chromaService.initializeCollection();
    console.log("✅ Collection initialized successfully");

    // Test 2: Generate test embedding
    console.log("\n2️⃣ Testing embedding generation...");
    const testText = "FEVICOL SH 1 KG adhesive for wood";
    const embedding = await embeddingService.generateEmbedding(testText);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // Test 3: Add test SKU
    console.log("\n3️⃣ Testing SKU addition...");
    const testSku = {
      id: "TEST001",
      sku: "TEST001",
      name: "Test Adhesive",
      description: "Test adhesive for wood",
      category_name: "Adhesives",
    };

    await chromaService.addSKU(
      testSku.id,
      embedding,
      {
        sku: testSku.sku,
        name: testSku.name,
        category_name: testSku.category_name,
      },
      testText
    );
    console.log("✅ Test SKU added successfully");

    // Test 4: Search by vector
    console.log("\n4️⃣ Testing vector search...");
    const searchResults = await chromaService.searchSKUs(embedding, 5);
    console.log(`✅ Found ${searchResults.length} results`);
    console.log(
      "📋 Search results:",
      searchResults.map((r) => ({ id: r.id, score: r.score.toFixed(3) }))
    );

    // Test 5: Search by text
    console.log("\n5️⃣ Testing text search...");
    const textResults = await chromaService.searchByText("wood adhesive", 5);
    console.log(`✅ Found ${textResults.length} results from text search`);
    console.log(
      "📋 Text search results:",
      textResults.map((r) => ({ id: r.id, score: r.score.toFixed(3) }))
    );

    // Test 6: Get SKU by ID
    console.log("\n6️⃣ Testing get by ID...");
    const retrievedSku = await chromaService.getSKU("TEST001");
    console.log("✅ Retrieved SKU:", retrievedSku ? "Found" : "Not found");

    // Test 7: Get collection stats
    console.log("\n7️⃣ Testing collection statistics...");
    const stats = await chromaService.getCollectionStats();
    console.log("✅ Collection stats:", stats);

    // Test 8: Get collection metadata
    console.log("\n8️⃣ Testing collection metadata...");
    const metadata = await chromaService.getCollectionMetadata();
    console.log("✅ Collection metadata:", metadata);

    // Test 9: Update SKU
    console.log("\n9️⃣ Testing SKU update...");
    const updatedEmbedding = await embeddingService.generateEmbedding(
      "Updated adhesive description"
    );
    await chromaService.updateSKU(
      "TEST001",
      updatedEmbedding,
      {
        sku: "TEST001",
        name: "Updated Test Adhesive",
        category_name: "Adhesives",
        updated: true,
      },
      "Updated adhesive description"
    );
    console.log("✅ SKU updated successfully");

    // Test 10: Batch operations
    console.log("\n🔟 Testing batch operations...");
    const batchSkus = [
      {
        id: "BATCH001",
        vector: embedding,
        metadata: { sku: "BATCH001", name: "Batch Test 1" },
        document: "Batch test adhesive 1",
      },
      {
        id: "BATCH002",
        vector: embedding,
        metadata: { sku: "BATCH002", name: "Batch Test 2" },
        document: "Batch test adhesive 2",
      },
    ];

    await chromaService.addBatchSKUs(batchSkus);
    console.log("✅ Batch SKUs added successfully");

    // Test 11: Get multiple SKUs
    console.log("\n1️⃣1️⃣ Testing get multiple SKUs...");
    const multipleSkus = await chromaService.getSKUs(["TEST001", "BATCH001"]);
    console.log(`✅ Retrieved ${multipleSkus.length} SKUs`);

    // Test 12: Delete test SKUs
    console.log("\n1️⃣2️⃣ Testing SKU deletion...");
    await chromaService.deleteSKUs(["TEST001", "BATCH001", "BATCH002"]);
    console.log("✅ Test SKUs deleted successfully");

    console.log("\n🎉 All Chroma integration tests passed!");
    console.log("✅ Chroma is working correctly with the latest SDK");
  } catch (error) {
    console.error("❌ Chroma integration test failed:", error);
    process.exit(1);
  }
}

// Run the test
testChromaIntegration();
