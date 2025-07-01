import ChromaVectorDBService from "./chromaVectorDBService.js";

class ChromaVisualizationService {
  constructor() {
    this.chromaService = new ChromaVectorDBService();
  }

  /**
   * Get comprehensive collection overview
   * @returns {Promise<Object>} Collection overview data
   */
  async getCollectionOverview() {
    try {
      await this.chromaService.initializeCollection();

      const stats = await this.chromaService.getCollectionStats();
      const metadata = await this.chromaService.getCollectionMetadata();

      // Get sample data for analysis
      const sampleData = await this.getSampleData(10);

      return {
        collection: {
          name: stats.collectionName,
          totalVectors: stats.totalVectorCount,
          dimension: stats.dimension,
          metadata: stats.metadata,
        },
        sampleData,
        analysis: await this.analyzeData(sampleData),
        summary: this.generateSummary(stats, sampleData),
      };
    } catch (error) {
      console.error("Error getting collection overview:", error);
      throw error;
    }
  }

  /**
   * Get sample data from collection
   * @param {number} limit - Number of samples to retrieve
   * @returns {Promise<Array>} Sample data
   */
  async getSampleData(limit = 10) {
    try {
      const stats = await this.chromaService.getCollectionStats();
      const sampleIds = stats.sampleIds.slice(0, limit);

      if (sampleIds.length === 0) {
        return [];
      }

      const sampleData = await this.chromaService.getSKUs(sampleIds);
      return sampleData.map((item) => ({
        id: item.id,
        metadata: item.metadata,
        document: item.document,
        embeddingLength: item.embedding?.length || 0,
      }));
    } catch (error) {
      console.error("Error getting sample data:", error);
      return [];
    }
  }

  /**
   * Analyze data patterns
   * @param {Array} data - Sample data
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeData(data) {
    if (data.length === 0) {
      return {
        categories: {},
        fieldStats: {},
        patterns: [],
      };
    }

    // Analyze categories
    const categories = {};
    const fieldStats = {
      hasDescription: 0,
      hasCategory: 0,
      hasPrice: 0,
      hasImages: 0,
    };

    data.forEach((item) => {
      const metadata = item.metadata || {};

      // Category analysis
      if (metadata.category_name) {
        categories[metadata.category_name] =
          (categories[metadata.category_name] || 0) + 1;
        fieldStats.hasCategory++;
      }

      // Field presence analysis
      if (metadata.description) fieldStats.hasDescription++;
      if (metadata.mrp || metadata.selling_price) fieldStats.hasPrice++;
      if (metadata.image_urls && metadata.image_urls.length > 0)
        fieldStats.hasImages++;
    });

    // Calculate percentages
    const total = data.length;
    Object.keys(fieldStats).forEach((key) => {
      fieldStats[key] = {
        count: fieldStats[key],
        percentage: Math.round((fieldStats[key] / total) * 100),
      };
    });

    return {
      categories,
      fieldStats,
      patterns: this.identifyPatterns(data),
    };
  }

  /**
   * Identify data patterns
   * @param {Array} data - Sample data
   * @returns {Array} Identified patterns
   */
  identifyPatterns(data) {
    const patterns = [];

    // Check for common patterns
    const hasConsistentIds = data.every(
      (item) => item.id && item.id.toString().length > 0
    );
    const hasConsistentEmbeddings = data.every(
      (item) => item.embeddingLength === 1536
    );

    if (hasConsistentIds) {
      patterns.push("✅ Consistent ID format across all records");
    }

    if (hasConsistentEmbeddings) {
      patterns.push("✅ All embeddings have correct dimension (1536)");
    }

    // Check for metadata completeness
    const completeRecords = data.filter(
      (item) => item.metadata && item.metadata.name && item.metadata.sku
    ).length;

    if (completeRecords === data.length) {
      patterns.push("✅ All records have complete basic metadata");
    } else {
      patterns.push(
        `⚠️ ${data.length - completeRecords} records missing basic metadata`
      );
    }

    return patterns;
  }

  /**
   * Generate summary statistics
   * @param {Object} stats - Collection statistics
   * @param {Array} sampleData - Sample data
   * @returns {Object} Summary information
   */
  generateSummary(stats, sampleData) {
    return {
      totalRecords: stats.totalVectorCount,
      collectionAge: this.calculateCollectionAge(stats.metadata?.created_at),
      dataQuality: this.assessDataQuality(sampleData),
      recommendations: this.generateRecommendations(stats, sampleData),
    };
  }

  /**
   * Calculate collection age
   * @param {string} createdAt - Creation timestamp
   * @returns {string} Age description
   */
  calculateCollectionAge(createdAt) {
    if (!createdAt) return "Unknown";

    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Created today";
    if (diffDays === 1) return "Created yesterday";
    if (diffDays < 7) return `Created ${diffDays} days ago`;
    if (diffDays < 30) return `Created ${Math.floor(diffDays / 7)} weeks ago`;
    return `Created ${Math.floor(diffDays / 30)} months ago`;
  }

  /**
   * Assess data quality
   * @param {Array} sampleData - Sample data
   * @returns {Object} Quality assessment
   */
  assessDataQuality(sampleData) {
    if (sampleData.length === 0) {
      return { score: 0, issues: ["No data available"] };
    }

    const issues = [];
    let score = 100;

    // Check embedding consistency
    const embeddingLengths = sampleData.map((item) => item.embeddingLength);
    const uniqueLengths = new Set(embeddingLengths);
    if (uniqueLengths.size > 1) {
      issues.push("Inconsistent embedding dimensions");
      score -= 20;
    }

    // Check metadata completeness
    const incompleteRecords = sampleData.filter(
      (item) => !item.metadata || !item.metadata.name
    ).length;

    if (incompleteRecords > 0) {
      issues.push(`${incompleteRecords} records missing essential metadata`);
      score -= (incompleteRecords / sampleData.length) * 30;
    }

    // Check document content
    const emptyDocuments = sampleData.filter(
      (item) => !item.document || item.document.trim().length === 0
    ).length;

    if (emptyDocuments > 0) {
      issues.push(`${emptyDocuments} records have empty documents`);
      score -= (emptyDocuments / sampleData.length) * 25;
    }

    return {
      score: Math.max(0, Math.round(score)),
      issues: issues.length > 0 ? issues : ["No major issues detected"],
    };
  }

  /**
   * Generate recommendations
   * @param {Object} stats - Collection statistics
   * @param {Array} sampleData - Sample data
   * @returns {Array} Recommendations
   */
  generateRecommendations(stats, sampleData) {
    const recommendations = [];

    if (stats.totalVectorCount < 100) {
      recommendations.push(
        "📈 Consider adding more SKUs for better search results"
      );
    }

    if (stats.totalVectorCount > 10000) {
      recommendations.push(
        "⚡ Large dataset detected - consider implementing pagination"
      );
    }

    const quality = this.assessDataQuality(sampleData);
    if (quality.score < 80) {
      recommendations.push(
        "🔧 Data quality issues detected - review and clean your data"
      );
    }

    if (!stats.metadata?.embedding_model) {
      recommendations.push(
        "🏷️ Add embedding model metadata for better tracking"
      );
    }

    return recommendations;
  }

  /**
   * Generate visualization data for charts
   * @returns {Promise<Object>} Chart data
   */
  async getChartData() {
    try {
      const overview = await this.getCollectionOverview();
      const analysis = overview.analysis;

      return {
        categories: {
          labels: Object.keys(analysis.categories),
          data: Object.values(analysis.categories),
        },
        fieldCompleteness: {
          labels: Object.keys(analysis.fieldStats),
          data: Object.values(analysis.fieldStats).map(
            (stat) => stat.percentage
          ),
        },
        qualityScore: overview.summary.dataQuality.score,
        totalRecords: overview.summary.totalRecords,
      };
    } catch (error) {
      console.error("Error generating chart data:", error);
      throw error;
    }
  }

  /**
   * Export collection data for external visualization
   * @param {number} limit - Number of records to export
   * @returns {Promise<Object>} Export data
   */
  async exportForVisualization(limit = 100) {
    try {
      const stats = await this.chromaService.getCollectionStats();
      const sampleIds = stats.sampleIds.slice(0, limit);

      if (sampleIds.length === 0) {
        return { records: [], metadata: {} };
      }

      const records = await this.chromaService.getSKUs(sampleIds);

      return {
        records: records.map((record) => ({
          id: record.id,
          metadata: record.metadata,
          document: record.document,
          embeddingLength: record.embedding?.length || 0,
        })),
        metadata: {
          totalRecords: stats.totalVectorCount,
          exportedRecords: records.length,
          collectionName: stats.collectionName,
          exportDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }
}

export default ChromaVisualizationService;
