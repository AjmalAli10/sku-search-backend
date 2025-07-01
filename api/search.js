import { normalizeQuery, analyzeQuery, testNormalization } from '../normalization/index.js';

const searchHandler = async (req, res, next) => {
  try {
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
        message: "Please provide a search query"
      });
    }

    // Normalize the query
    const normalizedResult = normalizeQuery(query, {
      enableSpellcheck: options.enableSpellcheck !== false,
      enableSynonyms: options.enableSynonyms !== false,
      enableASRFix: options.enableASRFix !== false,
      expandSynonyms: options.expandSynonyms || false,
      returnMetadata: options.returnMetadata !== false
    });

    // Analyze the query for additional insights
    const analysis = analyzeQuery(query);

    // Prepare response
    const response = {
      success: true,
      originalQuery: query,
      normalizedQuery: normalizedResult.normalized,
      analysis: analysis.analysis,
      metadata: normalizedResult.metadata,
      timestamp: new Date().toISOString()
    };

    // Add suggestions if any
    if (analysis.analysis.suggestions.length > 0) {
      response.suggestions = analysis.analysis.suggestions;
    }

    res.json(response);

  } catch (error) {
    console.error("Search handler error:", error);
    next(error); // Pass error to global error handler
  }
};

// Test endpoint for normalization
const testNormalizationHandler = async (req, res, next) => {
  try {
    const { queries = [] } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: "Queries array is required",
        message: "Please provide an array of test queries"
      });
    }

    const testResults = testNormalization(queries);

    res.json({
      success: true,
      testResults,
      summary: {
        total: testResults.total,
        successful: testResults.successful,
        failed: testResults.failed,
        successRate: (testResults.successful / testResults.total * 100).toFixed(2) + '%'
      }
    });

  } catch (error) {
    console.error("Test normalization handler error:", error);
    next(error);
  }
};

// Analyze endpoint for detailed query analysis
const analyzeQueryHandler = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
        message: "Please provide a query to analyze"
      });
    }

    const analysis = analyzeQuery(query);
    const normalized = normalizeQuery(query, { returnMetadata: true });

    res.json({
      success: true,
      query: query,
      analysis: analysis.analysis,
      normalization: normalized,
      recommendations: generateRecommendations(analysis.analysis)
    });

  } catch (error) {
    console.error("Analyze query handler error:", error);
    next(error);
  }
};

// Helper function to generate recommendations
const generateRecommendations = (analysis) => {
  const recommendations = [];

  if (analysis.hasSpellingErrors) {
    recommendations.push({
      type: "spelling",
      message: "Consider correcting spelling errors for better search results",
      count: analysis.spellingErrors.length
    });
  }

  if (analysis.hasASRErrors) {
    recommendations.push({
      type: "asr",
      message: "Voice transcription errors detected. Consider rephrasing your query",
      count: analysis.asrErrors.length
    });
  }

  if (analysis.hasSynonyms) {
    recommendations.push({
      type: "synonym",
      message: "Synonyms available for some terms. Consider using alternative words",
      count: analysis.synonymOpportunities.length
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "clean",
      message: "Query looks good! No major issues detected."
    });
  }

  return recommendations;
};

export { searchHandler, testNormalizationHandler, analyzeQueryHandler };
