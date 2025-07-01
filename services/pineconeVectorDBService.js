import { Pinecone } from "@pinecone-database/pinecone";

class PineconeVectorDBService {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.indexName = process.env.PINECONE_INDEX_NAME || "sku-embeddings";
    this.index = null;
  }

  /**
   * Initialize the Pinecone index
   * @returns {Promise<void>}
   */
  async initializeIndex() {
    try {
      console.log(`🔧 Initializing Pinecone index: ${this.indexName}`);

      // Try to connect to the index directly first
      try {
        this.index = this.pinecone.index(this.indexName);
        // Test if the index exists by trying to get its stats
        await this.index.describeIndexStats();
        console.log(
          `✅ Pinecone index '${this.indexName}' already exists and is ready`
        );
        return;
      } catch (error) {
        // Index doesn't exist, create it
        console.log(`📝 Creating new index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI text-embedding-3-small dimension
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });

        // Wait for index to be ready
        console.log("⏳ Waiting for index to be ready...");
        await this.waitForIndexReady();

        this.index = this.pinecone.index(this.indexName);
        console.log(`✅ Pinecone index '${this.indexName}' is ready`);
      }
    } catch (error) {
      console.error("❌ Error initializing Pinecone index:", error);
      throw new Error(`Failed to initialize Pinecone index: ${error.message}`);
    }
  }

  /**
   * Wait for index to be ready
   * @returns {Promise<void>}
   */
  async waitForIndexReady() {
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (attempts < maxAttempts) {
      try {
        const indexStats = await this.pinecone.describeIndex(this.indexName);
        if (indexStats.status?.ready) {
          console.log("✅ Index is ready!");
          return;
        }
      } catch (error) {
        // Index might not be ready yet
      }

      console.log(
        `⏳ Waiting for index... (attempt ${attempts + 1}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    throw new Error("Index did not become ready in time");
  }

  /**
   * Add a single SKU vector to the index
   * @param {string} id - SKU ID
   * @param {number[]} vector - Embedding vector
   * @param {Object} metadata - SKU metadata
   * @returns {Promise<void>}
   */
  async addSKU(id, vector, metadata = {}) {
    try {
      await this.index.upsert([
        {
          id: id.toString(),
          values: vector,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            vector_type: "openai_embedding",
          },
        },
      ]);

      console.log(`✅ Added SKU ${id} to Pinecone index`);
    } catch (error) {
      console.error(`❌ Error adding SKU ${id}:`, error);
      throw new Error(`Failed to add SKU to Pinecone: ${error.message}`);
    }
  }

  /**
   * Add multiple SKU vectors in batch
   * @param {Array<{id: string, vector: number[], metadata: Object}>} skuVectors
   * @returns {Promise<void>}
   */
  async addBatchSKUs(skuVectors) {
    try {
      // Pinecone recommends batches of 100
      const batchSize = 100;

      for (let i = 0; i < skuVectors.length; i += batchSize) {
        const batch = skuVectors.slice(i, i + batchSize);

        const vectors = batch.map((sku) => ({
          id: sku.id.toString(),
          values: sku.vector,
          metadata: {
            ...sku.metadata,
            timestamp: new Date().toISOString(),
            vector_type: "openai_embedding",
          },
        }));

        await this.index.upsert(vectors);

        console.log(
          `✅ Added batch ${Math.floor(i / batchSize) + 1}: ${
            batch.length
          } SKUs`
        );
      }

      console.log(
        `✅ Completed adding ${skuVectors.length} SKUs to Pinecone index`
      );
    } catch (error) {
      console.error("❌ Error adding batch SKUs:", error);
      throw new Error(`Failed to add batch SKUs to Pinecone: ${error.message}`);
    }
  }

  /**
   * Search for similar SKUs using semantic search
   * @param {number[]} queryVector - Query embedding vector
   * @param {number} topK - Number of results to return
   * @param {Object} filter - Optional metadata filter
   * @returns {Promise<Array>} - Search results
   */
  async searchSKUs(queryVector, topK = 10, filter = {}) {
    try {
      const searchResponse = await this.index.query({
        vector: queryVector,
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata: true,
      });

      // Transform response to match expected format
      const results = searchResponse.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata || {},
        distance: 1 - match.score, // Convert similarity to distance
      }));

      return results;
    } catch (error) {
      console.error("❌ Error searching SKUs:", error);
      throw new Error(`Failed to search SKUs in Pinecone: ${error.message}`);
    }
  }

  /**
   * Get SKU by ID
   * @param {string} id - SKU ID
   * @returns {Promise<Object|null>} - SKU data or null if not found
   */
  async getSKU(id) {
    try {
      const response = await this.index.fetch([id.toString()]);
      const record = response.records[id.toString()];

      if (!record) {
        return null;
      }

      return {
        id: record.id,
        metadata: record.metadata || {},
        values: record.values,
      };
    } catch (error) {
      console.error(`❌ Error getting SKU ${id}:`, error);
      throw new Error(`Failed to get SKU from Pinecone: ${error.message}`);
    }
  }

  /**
   * Delete SKU by ID
   * @param {string} id - SKU ID
   * @returns {Promise<void>}
   */
  async deleteSKU(id) {
    try {
      await this.index.deleteOne(id.toString());
      console.log(`✅ Deleted SKU ${id} from Pinecone index`);
    } catch (error) {
      console.error(`❌ Error deleting SKU ${id}:`, error);
      throw new Error(`Failed to delete SKU from Pinecone: ${error.message}`);
    }
  }

  /**
   * Get index statistics
   * @returns {Promise<Object>} - Index statistics
   */
  async getIndexStats() {
    try {
      const stats = await this.index.describeIndexStats();
      // Pinecone serverless: vector count is under namespaces[""]
      const defaultNamespace = stats.namespaces?.[""] || {};
      return {
        totalVectorCount: defaultNamespace.vectorCount || 0,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces,
      };
    } catch (error) {
      console.error("❌ Error getting index stats:", error);
      throw new Error(`Failed to get Pinecone index stats: ${error.message}`);
    }
  }

  /**
   * Clear all data from the index
   * @returns {Promise<void>}
   */
  async clearIndex() {
    try {
      await this.index.deleteAll();
      console.log("✅ Cleared all data from Pinecone index");
    } catch (error) {
      console.error("❌ Error clearing index:", error);
      throw new Error(`Failed to clear Pinecone index: ${error.message}`);
    }
  }
}

export default PineconeVectorDBService;
