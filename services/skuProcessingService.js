import EmbeddingService from "./embeddingService.js";
import PineconeVectorDBService from "./pineconeVectorDBService.js";

class SKUProcessingService {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorDBService = new PineconeVectorDBService();
  }

  /**
   * Initialize the vector database
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.vectorDBService.initializeIndex();
  }

  /**
   * Process and store a single SKU
   * @param {Object} skuData - SKU data object
   * @returns {Promise<void>}
   */
  async processAndStoreSKU(skuData) {
    try {
      // Validate SKU data
      const validatedData = this.validateSKUData(skuData);

      // Generate embedding
      const embedding = await this.embeddingService.generateSKUEmbedding(
        validatedData
      );

      // Prepare metadata
      const metadata = this.prepareMetadata(validatedData);

      // Store in vector database
      await this.vectorDBService.addSKU(
        validatedData.id,
        embedding,
        metadata,
        this.embeddingService.createSKUText(validatedData)
      );

      console.log(
        `✅ Successfully processed and stored SKU: ${
          validatedData.sku || validatedData.id
        }`
      );
    } catch (error) {
      console.error(
        `❌ Error processing SKU ${skuData.id || skuData.sku}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process and store multiple SKUs in batch
   * @param {Array<Object>} skuDataArray - Array of SKU data objects
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  async processAndStoreBatchSKUs(skuDataArray) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Validate and prepare all SKU data
      const validSKUs = [];
      const invalidSKUs = [];

      for (const skuData of skuDataArray) {
        try {
          const validatedData = this.validateSKUData(skuData);
          validSKUs.push(validatedData);
        } catch (error) {
          invalidSKUs.push({
            sku: skuData.sku || skuData.id,
            error: error.message,
          });
          results.failed++;
        }
      }

      if (validSKUs.length === 0) {
        results.errors = invalidSKUs;
        return results;
      }

      // Generate embeddings for all valid SKUs
      const embeddingResult =
        await this.embeddingService.generateBatchSKUEmbeddings(validSKUs);

      console.log("embeddingResult", embeddingResult);

      // Prepare vectors for storage using the returned embeddings and texts
      const skuVectors = embeddingResult.validIndices.map(
        (originalIndex, resultIndex) => {
          const sku = validSKUs[originalIndex];
          return {
            id: sku.id,
            vector: embeddingResult.embeddings[resultIndex],
            metadata: this.prepareMetadata(sku),
            document: embeddingResult.texts[resultIndex], // Use the sanitized text from embedding service
          };
        }
      );

      console.log(`📦 Prepared ${skuVectors.length} vectors for storage`);
      console.log("🔍 Sample vector data:", {
        id: skuVectors[0]?.id,
        vectorLength: skuVectors[0]?.vector?.length,
        metadataKeys: Object.keys(skuVectors[0]?.metadata || {}),
        documentLength: skuVectors[0]?.document?.length,
      });

      // Store in vector database
      console.log("💾 Storing vectors in Pinecone...");
      await this.vectorDBService.addBatchSKUs(skuVectors);

      results.success = validSKUs.length;
      results.errors = invalidSKUs;

      console.log(
        `✅ Batch processing completed: ${results.success} successful, ${results.failed} failed`
      );
    } catch (error) {
      console.error("❌ Error in batch processing:", error);
      results.failed += skuDataArray.length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Validate SKU data
   * @param {Object} skuData - SKU data to validate
   * @returns {Object} - Validated SKU data
   */
  validateSKUData(skuData) {
    if (!skuData) {
      throw new Error("SKU data is required");
    }

    if (!skuData.id && !skuData.sku) {
      throw new Error("SKU ID or SKU code is required");
    }

    // Ensure required fields exist
    const validatedData = {
      id: skuData.id || skuData.sku,
      sku: skuData.sku,
      name: skuData.name || "",
      description: skuData.description || "",
      category_id: skuData.category_id,
      category_name: skuData.category_name || "",
      mrp: skuData.mrp,
      selling_price: skuData.selling_price,
      per_unit_mrp_price: skuData.per_unit_mrp_price,
      per_unit_selling_price: skuData.per_unit_selling_price,
      unit_type: skuData.unit_type,
      unit_value: skuData.unit_value,
      discount: skuData.discount,
      status: skuData.status,
      is_active: skuData.is_active,
      image_urls: skuData.image_urls,
      created_at: skuData.created_at,
      updated_at: skuData.updated_at,
    };

    return validatedData;
  }

  /**
   * Prepare metadata for vector storage
   * @param {Object} skuData - Validated SKU data
   * @returns {Object} - Metadata object
   */
  prepareMetadata(skuData) {
    // Helper function to sanitize metadata values
    const sanitizeValue = (value) => {
      if (value === null || value === undefined || value === "NULL") {
        return ""; // Return empty string instead of null for Pinecone compatibility
      }
      if (typeof value === "string") {
        return value.trim();
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.join(", "); // Convert arrays to comma-separated strings
      }
      if (typeof value === "object") {
        return JSON.stringify(value); // Convert objects to JSON strings
      }
      return String(value); // Convert everything else to string
    };

    return {
      sku: sanitizeValue(skuData.sku),
      name: sanitizeValue(skuData.name),
      description: sanitizeValue(skuData.description),
      category_id: sanitizeValue(skuData.category_id),
      category_name: sanitizeValue(skuData.category_name),
      mrp: sanitizeValue(skuData.mrp),
      selling_price: sanitizeValue(skuData.selling_price),
      per_unit_mrp_price: sanitizeValue(skuData.per_unit_mrp_price),
      per_unit_selling_price: sanitizeValue(skuData.per_unit_selling_price),
      unit_type: sanitizeValue(skuData.unit_type),
      unit_value: sanitizeValue(skuData.unit_value),
      discount: sanitizeValue(skuData.discount),
      status: sanitizeValue(skuData.status),
      is_active: sanitizeValue(skuData.is_active),
      image_urls: sanitizeValue(skuData.image_urls),
      created_at: sanitizeValue(skuData.created_at),
      updated_at: sanitizeValue(skuData.updated_at),
    };
  }

  /**
   * Get vector database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getStats() {
    return await this.vectorDBService.getIndexStats();
  }

  /**
   * Delete a SKU from vector database
   * @param {string} skuId - SKU ID to delete
   * @returns {Promise<void>}
   */
  async deleteSKU(skuId) {
    await this.vectorDBService.deleteSKU(skuId);
  }

  /**
   * Get embedding model information
   * @returns {Object} - Model information
   */
  getModelInfo() {
    return this.embeddingService.getModelInfo();
  }
}

export default SKUProcessingService;
