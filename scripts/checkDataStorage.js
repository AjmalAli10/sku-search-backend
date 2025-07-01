import ChromaVectorDBService from "../services/chromaVectorDBService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class DataStorageChecker {
  constructor() {
    this.chroma = new ChromaVectorDBService();
  }

  /**
   * Check if Chroma server is running and accessible
   */
  async checkChromaConnection() {
    console.log("🔍 Checking Chroma connection...");
    try {
      await this.chroma.initializeCollection();
      console.log("✅ Chroma connection successful");
      return true;
    } catch (error) {
      console.error("❌ Chroma connection failed:", error.message);
      console.log("\n💡 Make sure Chroma server is running:");
      console.log("   docker-compose up -d chroma");
      return false;
    }
  }

  /**
   * Get basic collection statistics
   */
  async getCollectionStats() {
    console.log("\n📊 Collection Statistics:");
    try {
      const stats = await this.chroma.getCollectionStats();
      console.log(`   Collection Name: ${stats.collectionName}`);
      console.log(`   Total SKUs: ${stats.totalVectorCount}`);
      console.log(`   Vector Dimension: ${stats.dimension}`);
      console.log(`   Created: ${stats.timestamp}`);

      if (stats.sampleIds.length > 0) {
        console.log(
          `   Sample IDs: ${stats.sampleIds.slice(0, 5).join(", ")}${
            stats.sampleIds.length > 5 ? "..." : ""
          }`
        );
      }

      return stats;
    } catch (error) {
      console.error("❌ Error getting collection stats:", error.message);
      return null;
    }
  }

  /**
   * Check if specific SKU IDs exist
   */
  async checkSpecificSKUs(skuIds) {
    console.log(`\n🔍 Checking specific SKU IDs: ${skuIds.join(", ")}`);

    try {
      const skus = await this.chroma.getSKUs(skuIds);
      console.log(`   Found ${skus.length} out of ${skuIds.length} SKUs`);

      skus.forEach((sku, index) => {
        console.log(`   [${index + 1}] SKU ${sku.id}:`);
        console.log(`       Name: ${sku.metadata?.name || "N/A"}`);
        console.log(`       Category: ${sku.metadata?.category_name || "N/A"}`);
        console.log(`       Has Embedding: ${sku.embedding ? "Yes" : "No"}`);
        console.log(
          `       Document Length: ${sku.document?.length || 0} chars`
        );
      });

      return skus;
    } catch (error) {
      console.error("❌ Error checking specific SKUs:", error.message);
      return [];
    }
  }

  /**
   * Get sample data from collection
   */
  async getSampleData(limit = 5) {
    console.log(`\n📋 Sample Data (${limit} items):`);

    try {
      const stats = await this.chroma.getCollectionStats();

      if (stats.totalVectorCount === 0) {
        console.log("   No data found in collection");
        return [];
      }

      const sampleIds = stats.sampleIds.slice(0, limit);
      if (sampleIds.length === 0) {
        console.log("   No sample IDs available");
        return [];
      }

      const skus = await this.chroma.getSKUs(sampleIds);

      skus.forEach((sku, index) => {
        console.log(`\n   [${index + 1}] SKU ID: ${sku.id}`);
        console.log(`       Name: ${sku.metadata?.name || "N/A"}`);
        console.log(`       Category: ${sku.metadata?.category_name || "N/A"}`);
        console.log(`       Brand: ${sku.metadata?.brand || "N/A"}`);
        console.log(`       Price: ${sku.metadata?.price || "N/A"}`);
        console.log(
          `       Embedding Vector: ${
            sku.embedding ? `${sku.embedding.length} dimensions` : "Missing"
          }`
        );
        console.log(
          `       Document Preview: ${sku.document?.substring(0, 100)}${
            sku.document?.length > 100 ? "..." : ""
          }`
        );
      });

      return skus;
    } catch (error) {
      console.error("❌ Error getting sample data:", error.message);
      return [];
    }
  }

  /**
   * Search for data using text query
   */
  async searchData(query, limit = 3) {
    console.log(`\n🔎 Searching for: "${query}"`);

    try {
      const results = await this.chroma.searchByText(query, limit);

      if (results.length === 0) {
        console.log("   No results found");
        return [];
      }

      console.log(`   Found ${results.length} results:`);

      results.forEach((result, index) => {
        console.log(`\n   [${index + 1}] SKU ID: ${result.id}`);
        console.log(`       Score: ${(result.score * 100).toFixed(2)}%`);
        console.log(`       Name: ${result.metadata?.name || "N/A"}`);
        console.log(
          `       Category: ${result.metadata?.category_name || "N/A"}`
        );
        console.log(
          `       Document Preview: ${result.document?.substring(0, 100)}${
            result.document?.length > 100 ? "..." : ""
          }`
        );
      });

      return results;
    } catch (error) {
      console.error("❌ Error searching data:", error.message);
      return [];
    }
  }

  /**
   * Comprehensive data verification
   */
  async verifyDataStorage() {
    console.log("🚀 Starting Data Storage Verification\n");
    console.log("=".repeat(50));

    // Check connection
    const isConnected = await this.checkChromaConnection();
    if (!isConnected) {
      console.log("\n❌ Cannot proceed without Chroma connection");
      return false;
    }

    // Get collection stats
    const stats = await this.getCollectionStats();
    if (!stats) {
      console.log("\n❌ Cannot get collection statistics");
      return false;
    }

    // Check if collection has data
    if (stats.totalVectorCount === 0) {
      console.log("\n⚠️  Collection is empty - no data found!");
      console.log("💡 To load data, run: node scripts/loadCSVSKUs.js");
      return false;
    }

    console.log(`\n✅ Data storage verification successful!`);
    console.log(`   Found ${stats.totalVectorCount} SKUs in the collection`);

    // Get sample data
    await this.getSampleData(3);

    // Try a search
    await this.searchData("product", 2);

    return true;
  }

  /**
   * Quick status check
   */
  async quickStatus() {
    try {
      await this.chroma.initializeCollection();
      const stats = await this.chroma.getCollectionStats();

      console.log(`📊 Status: ${stats.totalVectorCount} SKUs stored`);
      console.log(`📁 Collection: ${stats.collectionName}`);

      if (stats.totalVectorCount > 0) {
        console.log("✅ Data is stored and accessible");
        return true;
      } else {
        console.log("⚠️  Collection is empty");
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking status:", error.message);
      return false;
    }
  }
}

// Main execution
async function main() {
  const checker = new DataStorageChecker();

  // Check command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || "verify";

  switch (command) {
    case "status":
      await checker.quickStatus();
      break;

    case "stats":
      await checker.checkChromaConnection();
      await checker.getCollectionStats();
      break;

    case "sample":
      await checker.checkChromaConnection();
      await checker.getSampleData(parseInt(args[1]) || 5);
      break;

    case "search":
      if (!args[1]) {
        console.log("Usage: node scripts/checkDataStorage.js search <query>");
        return;
      }
      await checker.checkChromaConnection();
      await checker.searchData(args[1], parseInt(args[2]) || 3);
      break;

    case "check":
      if (!args[1]) {
        console.log(
          "Usage: node scripts/checkDataStorage.js check <sku_id1,sku_id2,...>"
        );
        return;
      }
      const skuIds = args[1].split(",");
      await checker.checkChromaConnection();
      await checker.checkSpecificSKUs(skuIds);
      break;

    case "verify":
    default:
      await checker.verifyDataStorage();
      break;
  }
}

// Handle errors
main().catch((error) => {
  console.error("\n💥 Fatal error:", error.message);
  console.log("\n💡 Troubleshooting tips:");
  console.log(
    "   1. Make sure Chroma server is running: docker-compose up -d chroma"
  );
  console.log("   2. Check your .env file has correct CHROMA_PATH");
  console.log("   3. Verify your data loading script ran successfully");
  process.exit(1);
});
