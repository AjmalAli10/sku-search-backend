import { ChromaClient } from "chromadb";

class ChromaVectorDBService {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_PATH || "http://localhost:8000",
    });

    this.collectionName =
      process.env.CHROMA_COLLECTION_NAME || "sku-embeddings";
    this.collection = null;
  }

  /**
   * Initialize the Chroma collection with proper configuration
   * @returns {Promise<void>}
   */
  async initializeCollection() {
    try {
      console.log(`🔧 Initializing Chroma collection: ${this.collectionName}`);

      // Check if collection exists first
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        });
        console.log(`✅ Using existing collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        console.log(`📝 Creating new collection: ${this.collectionName}`);
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          embeddingFunction: null, // Explicitly set to null since we use OpenAI embeddings
          metadata: {
            description: "SKU embeddings for semantic search",
            created_at: new Date().toISOString(),
            embedding_model: "text-embedding-3-small",
            dimension: 1536,
            embedding_provider: "openai",
          },
        });
      }

      console.log(`✅ Chroma collection '${this.collectionName}' is ready`);
    } catch (error) {
      console.error("❌ Error initializing Chroma collection:", error);
      throw new Error(
        `Failed to initialize Chroma collection: ${error.message}`
      );
    }
  }

  /**
   * Add a single SKU vector to the collection
   * @param {string} id - SKU ID
   * @param {number[]} vector - Embedding vector
   * @param {Object} metadata - SKU metadata
   * @param {string} document - Text document for the SKU
   * @returns {Promise<void>}
   */
  async addSKU(id, vector, metadata = {}, document = "") {
    try {
      await this.collection.add({
        ids: [id.toString()],
        embeddings: [vector],
        metadatas: [
          {
            ...metadata,
            timestamp: new Date().toISOString(),
            vector_type: "openai_embedding",
          },
        ],
        documents: [document],
      });

      console.log(`✅ Added SKU ${id} to Chroma collection`);
    } catch (error) {
      console.error(`❌ Error adding SKU ${id}:`, error);
      throw new Error(`Failed to add SKU to Chroma: ${error.message}`);
    }
  }

  /**
   * Add multiple SKU vectors in batch with optimized batching
   * @param {Array<{id: string, vector: number[], metadata: Object, document: string}>} skuVectors
   * @returns {Promise<void>}
   */
  async addBatchSKUs(skuVectors) {
    try {
      // Optimize batch size for Chroma (recommended: 100-1000 per batch)
      const batchSize = 100;

      for (let i = 0; i < skuVectors.length; i += batchSize) {
        const batch = skuVectors.slice(i, i + batchSize);

        const ids = batch.map((sku) => sku.id.toString());
        const embeddings = batch.map((sku) => sku.vector);
        const metadatas = batch.map((sku) => ({
          ...sku.metadata,
          timestamp: new Date().toISOString(),
          vector_type: "openai_embedding",
        }));
        const documents = batch.map((sku) => sku.document || "");

        await this.collection.add({
          ids,
          embeddings,
          metadatas,
          documents,
        });

        console.log(
          `✅ Added batch ${Math.floor(i / batchSize) + 1}: ${
            batch.length
          } SKUs`
        );
      }

      console.log(
        `✅ Completed adding ${skuVectors.length} SKUs to Chroma collection`
      );
    } catch (error) {
      console.error("❌ Error adding batch SKUs:", error);
      throw new Error(`Failed to add batch SKUs to Chroma: ${error.message}`);
    }
  }

  /**
   * Update existing SKU data
   * @param {string} id - SKU ID
   * @param {number[]} vector - Updated embedding vector
   * @param {Object} metadata - Updated metadata
   * @param {string} document - Updated document
   * @returns {Promise<void>}
   */
  async updateSKU(id, vector, metadata = {}, document = "") {
    try {
      await this.collection.update({
        ids: [id.toString()],
        embeddings: [vector],
        metadatas: [
          {
            ...metadata,
            timestamp: new Date().toISOString(),
            vector_type: "openai_embedding",
            updated: true,
          },
        ],
        documents: [document],
      });

      console.log(`✅ Updated SKU ${id} in Chroma collection`);
    } catch (error) {
      console.error(`❌ Error updating SKU ${id}:`, error);
      throw new Error(`Failed to update SKU in Chroma: ${error.message}`);
    }
  }

  /**
   * Search for similar SKUs using semantic search with enhanced options
   * @param {number[]} queryVector - Query embedding vector
   * @param {number} topK - Number of results to return
   * @param {Object} filter - Optional metadata filter
   * @param {Object} options - Additional search options
   * @returns {Promise<Array>} - Search results
   */
  async searchSKUs(queryVector, topK = 10, filter = {}, options = {}) {
    try {
      const searchResponse = await this.collection.query({
        queryEmbeddings: [queryVector],
        nResults: topK,
        where: Object.keys(filter).length > 0 ? filter : undefined,
        include: ["metadatas", "documents", "distances"],
        ...options,
      });

      // Transform response to match expected format
      const results = searchResponse.ids[0].map((id, index) => ({
        id,
        score: 1 - (searchResponse.distances[0][index] || 0), // Convert distance to similarity score
        metadata: searchResponse.metadatas[0][index] || {},
        document: searchResponse.documents[0][index] || "",
        distance: searchResponse.distances[0][index] || 0,
      }));

      return results;
    } catch (error) {
      console.error("❌ Error searching SKUs:", error);
      throw new Error(`Failed to search SKUs in Chroma: ${error.message}`);
    }
  }

  /**
   * Search by text query (convenience method)
   * @param {string} queryText - Text query
   * @param {number} topK - Number of results
   * @param {Object} filter - Metadata filter
   * @returns {Promise<Array>} - Search results
   */
  async searchByText(queryText, topK = 10, filter = {}) {
    try {
      const searchResponse = await this.collection.query({
        queryTexts: [queryText],
        nResults: topK,
        where: Object.keys(filter).length > 0 ? filter : undefined,
        include: ["metadatas", "documents", "distances"],
      });

      const results = searchResponse.ids[0].map((id, index) => ({
        id,
        score: 1 - (searchResponse.distances[0][index] || 0),
        metadata: searchResponse.metadatas[0][index] || {},
        document: searchResponse.documents[0][index] || "",
        distance: searchResponse.distances[0][index] || 0,
      }));

      return results;
    } catch (error) {
      console.error("❌ Error searching by text:", error);
      throw new Error(`Failed to search by text in Chroma: ${error.message}`);
    }
  }

  /**
   * Get SKU by ID with enhanced data retrieval
   * @param {string} id - SKU ID
   * @returns {Promise<Object|null>} - SKU data or null if not found
   */
  async getSKU(id) {
    try {
      const response = await this.collection.get({
        ids: [id.toString()],
        include: ["metadatas", "documents", "embeddings"],
      });

      if (response.ids.length === 0) {
        return null;
      }

      return {
        id: response.ids[0],
        metadata: response.metadatas[0],
        document: response.documents[0],
        embedding: response.embeddings[0],
      };
    } catch (error) {
      console.error(`❌ Error getting SKU ${id}:`, error);
      throw new Error(`Failed to get SKU from Chroma: ${error.message}`);
    }
  }

  /**
   * Get multiple SKUs by IDs
   * @param {Array<string>} ids - Array of SKU IDs
   * @returns {Promise<Array>} - Array of SKU data
   */
  async getSKUs(ids) {
    try {
      const response = await this.collection.get({
        ids: ids.map((id) => id.toString()),
        include: ["metadatas", "documents", "embeddings"],
      });

      return response.ids.map((id, index) => ({
        id,
        metadata: response.metadatas[index],
        document: response.documents[index],
        embedding: response.embeddings[index],
      }));
    } catch (error) {
      console.error("❌ Error getting SKUs:", error);
      throw new Error(`Failed to get SKUs from Chroma: ${error.message}`);
    }
  }

  /**
   * Delete SKU by ID
   * @param {string} id - SKU ID
   * @returns {Promise<void>}
   */
  async deleteSKU(id) {
    try {
      await this.collection.delete({
        ids: [id.toString()],
      });

      console.log(`✅ Deleted SKU ${id} from Chroma collection`);
    } catch (error) {
      console.error(`❌ Error deleting SKU ${id}:`, error);
      throw new Error(`Failed to delete SKU from Chroma: ${error.message}`);
    }
  }

  /**
   * Delete multiple SKUs by IDs
   * @param {Array<string>} ids - Array of SKU IDs
   * @returns {Promise<void>}
   */
  async deleteSKUs(ids) {
    try {
      await this.collection.delete({
        ids: ids.map((id) => id.toString()),
      });

      console.log(`✅ Deleted ${ids.length} SKUs from Chroma collection`);
    } catch (error) {
      console.error("❌ Error deleting SKUs:", error);
      throw new Error(`Failed to delete SKUs from Chroma: ${error.message}`);
    }
  }

  /**
   * Get collection statistics with enhanced information
   * @returns {Promise<Object>} - Collection statistics
   */
  async getCollectionStats() {
    try {
      const count = await this.collection.count();
      const collectionInfo = await this.collection.get();

      return {
        totalVectorCount: count,
        collectionName: this.collectionName,
        dimension: 1536, // OpenAI text-embedding-3-small dimension
        timestamp: new Date().toISOString(),
        metadata: collectionInfo.metadata || {},
        sampleIds: collectionInfo.ids?.slice(0, 5) || [], // First 5 IDs as sample
      };
    } catch (error) {
      console.error("❌ Error getting collection stats:", error);
      throw new Error(
        `Failed to get Chroma collection stats: ${error.message}`
      );
    }
  }

  /**
   * Clear all data from the collection
   * @returns {Promise<void>}
   */
  async clearCollection() {
    try {
      await this.collection.delete({
        where: {}, // Delete all documents
      });

      console.log(
        `✅ Cleared all data from Chroma collection '${this.collectionName}'`
      );
    } catch (error) {
      console.error("❌ Error clearing collection:", error);
      throw new Error(`Failed to clear Chroma collection: ${error.message}`);
    }
  }

  /**
   * Get collection metadata
   * @returns {Promise<Object>} - Collection metadata
   */
  async getCollectionMetadata() {
    try {
      const collectionInfo = await this.collection.get();
      return {
        name: this.collectionName,
        metadata: collectionInfo.metadata || {},
        count: await this.collection.count(),
      };
    } catch (error) {
      console.error("❌ Error getting collection metadata:", error);
      throw new Error(`Failed to get collection metadata: ${error.message}`);
    }
  }
}

export default ChromaVectorDBService;
