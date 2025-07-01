import OpenAI from "openai";

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embeddings for SKU data
   * @param {Object} skuData - SKU object with relevant fields
   * @returns {Promise<number[]>} - The embedding vector for the SKU
   */
  async generateSKUEmbedding(skuData) {
    try {
      // Create a comprehensive text representation of the SKU
      const skuText = this.createSKUText(skuData);
      return await this.generateEmbedding(skuText);
    } catch (error) {
      console.error("Error generating SKU embedding:", error);
      throw new Error(`Failed to generate SKU embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple SKUs in batch
   * @param {Array<Object>} skuDataArray - Array of SKU objects
   * @returns {Promise<{embeddings: number[][], texts: string[]}>} - Array of embedding vectors and texts
   */
  async generateBatchSKUEmbeddings(skuDataArray) {
    try {
      // Create text representations for all SKUs
      const skuTexts = skuDataArray.map((sku) => this.createSKUText(sku));

      // Sanitize and filter out invalid texts
      const validTextsWithIndex = skuTexts
        .map((text, index) => ({ text: this.sanitizeText(text), index }))
        .filter(({ text }) => text && text.trim().length > 0);

      if (validTextsWithIndex.length === 0) {
        throw new Error("No valid texts found for embedding");
      }

      const validTexts = validTextsWithIndex.map(({ text }) => text);

      console.log(
        `📝 Generating embeddings for ${validTexts.length} valid texts`
      );

      // Generate embeddings in batch
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: validTexts,
        encoding_format: "float",
      });

      return {
        embeddings: response.data.map((item) => item.embedding),
        texts: validTexts,
        validIndices: validTextsWithIndex.map(({ index }) => index),
      };
    } catch (error) {
      console.error("Error generating batch SKU embeddings:", error);
      throw new Error(
        `Failed to generate batch SKU embeddings: ${error.message}`
      );
    }
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - The text to embed
   * @returns {Promise<number[]>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Create a comprehensive text representation of SKU data
   * @param {Object} skuData - SKU object
   * @returns {string} - Formatted text for embedding
   */
  createSKUText(skuData) {
    const {
      sku,
      name,
      description,
      category_id,
      category_name,
      unit_type,
      unit_value,
      mrp,
      selling_price,
      per_unit_mrp_price,
      per_unit_selling_price,
      discount,
    } = skuData;

    // Build a comprehensive text representation
    let text = `${name} `;

    if (sku) text += `SKU: ${sku} `;
    if (description) text += `${description} `;
    if (category_id) text += `Category ID: ${category_id} `;
    if (category_name) text += `Category: ${category_name} `;

    // Add pricing information
    if (mrp) text += `MRP: ${mrp} `;
    if (selling_price) text += `Selling Price: ${selling_price} `;
    if (per_unit_mrp_price) text += `Per Unit MRP: ${per_unit_mrp_price} `;
    if (per_unit_selling_price)
      text += `Per Unit Selling Price: ${per_unit_selling_price} `;

    // Add unit information
    if (unit_type) text += `Unit Type: ${unit_type} `;
    if (unit_value) text += `Unit Value: ${unit_value} `;

    // Add discount information
    if (discount) text += `Discount: ${discount}% `;

    return text.trim();
  }

  /**
   * Sanitize text for OpenAI embedding API
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (!text || typeof text !== "string") {
      return "";
    }

    // Remove null values and convert to empty strings
    let sanitized = text
      .replace(/NULL/g, "")
      .replace(/null/g, "")
      .replace(/undefined/g, "")
      .replace(/None/g, "");

    // Remove special characters that might cause issues
    sanitized = sanitized
      .replace(/[^\w\s\-.,:;()%$#@!&*+=<>?[\]{}|\\/"'`~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit length to prevent token limit issues (OpenAI has limits)
    if (sanitized.length > 8000) {
      sanitized = sanitized.substring(0, 8000);
    }

    return sanitized;
  }

  /**
   * Get embedding model information
   * @returns {Object} - Model information
   */
  getModelInfo() {
    return {
      model: "text-embedding-3-small",
      dimension: 1536,
      provider: "OpenAI",
    };
  }
}

export default EmbeddingService;
