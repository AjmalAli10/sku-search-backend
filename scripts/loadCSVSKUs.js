import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import SKUProcessingService from "../services/skuProcessingService.js";

// Load environment variables
dotenv.config();

/**
 * Parse CSV data and convert to array of objects
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Array of SKU objects
 */
function parseCSV(csvContent) {
  try {
    // Split by lines and filter out empty lines
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(
        "CSV file must have at least a header row and one data row"
      );
    }

    // Parse headers (first row) - handle comma-separated with quotes
    const headers = parseCSVRow(lines[0]).map((header) =>
      header
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
    );

    console.log("📋 Headers found:", headers);

    // Parse data rows
    const skuData = lines.slice(1).map((line, index) => {
      const values = parseCSVRow(line);
      const sku = {};

      headers.forEach((header, colIndex) => {
        if (header && values[colIndex] !== undefined) {
          let value = values[colIndex].trim();

          // Handle HTML entities
          value = value.replace(/&quot;/g, '"');
          value = value.replace(/&amp;/g, "&");
          value = value.replace(/&lt;/g, "<");
          value = value.replace(/&gt;/g, ">");

          sku[header] = value;
        }
      });

      // Add row number for debugging
      sku.row_number = index + 2;

      return sku;
    });

    console.log(`📦 Loaded ${skuData.length} SKU records from CSV`);

    // Log first few records for verification
    if (skuData.length > 0) {
      console.log("🔍 Sample SKU data:");
      console.log(JSON.stringify(skuData[0], null, 2));
    }

    return skuData;
  } catch (error) {
    console.error("❌ Error parsing CSV:", error);
    throw error;
  }
}

/**
 * Parse a single CSV row, handling quoted values properly
 * @param {string} row - CSV row string
 * @returns {Array} - Array of field values
 */
function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Load SKU data from CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Array} - Array of SKU objects
 */
function loadSKUsFromCSV(filePath) {
  try {
    console.log(`📁 Reading CSV file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    // Read the CSV file
    const csvContent = fs.readFileSync(filePath, "utf8");

    // Parse CSV content
    return parseCSV(csvContent);
  } catch (error) {
    console.error("❌ Error reading CSV file:", error);
    throw error;
  }
}

/**
 * Validate and clean SKU data
 * @param {Array} skuData - Raw SKU data from CSV
 * @returns {Array} - Cleaned and validated SKU data
 */
function validateAndCleanSKUData(skuData) {
  const cleanedData = [];
  const errors = [];

  skuData.forEach((sku, index) => {
    try {
      // Ensure required fields exist
      if (!sku.id && !sku.sku) {
        throw new Error("SKU must have either id or sku field");
      }

      // Clean and validate data
      const cleanedSku = {
        id: sku.id || sku.sku,
        sku: sku.sku,
        name: sku.name || sku.product_name || "",
        description: sku.description || "",
        category_id: sku.category_id || sku.category,
        category_name: sku.category_name || "",
        mrp: sku.mrp,
        selling_price: sku.selling_price,
        per_unit_mrp_price: sku.per_unit_mrp_price,
        per_unit_selling_price: sku.per_unit_selling_price,
        unit_type: sku.unit_type,
        unit_value: sku.unit_value,
        discount: sku.discount,
        status: sku.status || "Active",
        is_active: sku.is_active !== undefined ? sku.is_active : 1,
        image_urls: sku.image_urls
          ? Array.isArray(sku.image_urls)
            ? sku.image_urls
            : [sku.image_urls]
          : [],
        created_at: sku.created_at,
        updated_at: sku.updated_at,
        created_by: sku.created_by,
        updated_by: sku.updated_by,
        category_brand_index_id: sku.category_brand_index_id,
      };

      // Convert string numbers to actual numbers
      if (cleanedSku.mrp && typeof cleanedSku.mrp === "string") {
        cleanedSku.mrp = parseFloat(cleanedSku.mrp) || null;
      }
      if (
        cleanedSku.selling_price &&
        typeof cleanedSku.selling_price === "string"
      ) {
        cleanedSku.selling_price = parseFloat(cleanedSku.selling_price) || null;
      }
      if (
        cleanedSku.category_id &&
        typeof cleanedSku.category_id === "string"
      ) {
        cleanedSku.category_id = parseInt(cleanedSku.category_id) || null;
      }

      // Clean image URLs - handle both array and string formats
      if (cleanedSku.image_urls && cleanedSku.image_urls.length > 0) {
        if (typeof cleanedSku.image_urls === "string") {
          // Handle comma or tab separated URLs
          cleanedSku.image_urls = cleanedSku.image_urls
            .split(/[,\t]/)
            .map((url) => url.trim())
            .filter((url) => url);
        }
      }

      cleanedData.push(cleanedSku);
    } catch (error) {
      errors.push({
        row: sku.row_number || index + 2,
        error: error.message,
        data: sku,
      });
    }
  });

  if (errors.length > 0) {
    console.log("⚠️ Validation errors found:");
    errors.forEach((error) => {
      console.log(`Row ${error.row}: ${error.error}`);
    });
  }

  return cleanedData;
}

async function loadCSVSKUs() {
  try {
    console.log("🚀 Starting CSV SKU data loading...");

    // Check for CSV file in common locations
    const possiblePaths = [
      "./data/skus.csv",
      "./skus.csv",
      "./data/sku_data.csv",
      "./sku_data.csv",
      "./data/products.csv",
      "./products.csv",
    ];

    let csvFilePath = null;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        csvFilePath = path;
        break;
      }
    }

    if (!csvFilePath) {
      console.log(
        "❌ No CSV file found. Please place your SKU CSV file in one of these locations:"
      );
      possiblePaths.forEach((path) => console.log(`   - ${path}`));
      console.log("\n📝 Or specify the file path as a command line argument:");
      console.log("   npm run load-csv -- /path/to/your/skus.csv");
      process.exit(1);
    }

    // Load SKU data from CSV
    const rawSkuData = loadSKUsFromCSV(csvFilePath);

    // Validate and clean the data
    console.log("🔍 Validating and cleaning SKU data...");
    const cleanedSkuData = validateAndCleanSKUData(rawSkuData);

    if (cleanedSkuData.length === 0) {
      console.log("❌ No valid SKU data found after validation");
      process.exit(1);
    }

    console.log(`✅ Validated ${cleanedSkuData.length} SKU records`);

    // Initialize the SKU processing service
    const skuProcessingService = new SKUProcessingService();

    // Initialize the vector database
    console.log("📊 Initializing vector database...");
    await skuProcessingService.initialize();

    // Process and store SKUs in batch
    console.log(`📦 Processing ${cleanedSkuData.length} SKUs for embedding...`);
    const results = await skuProcessingService.processAndStoreBatchSKUs(
      cleanedSkuData
    );

    console.log("✅ CSV SKU loading and embedding completed!");
    console.log(
      `📈 Results: ${results.success} successful, ${results.failed} failed`
    );

    if (results.errors.length > 0) {
      console.log("❌ Errors:", results.errors);
    }

    // Get final statistics
    const stats = await skuProcessingService.getStats();
    console.log("📊 Final database stats:", stats);

    // Get collection metadata for additional info
    const metadata =
      await skuProcessingService.vectorDBService.getCollectionMetadata();
    console.log("📋 Collection metadata:", metadata);

    console.log(
      "\n🎉 All SKU data has been processed and embedded successfully!"
    );
    console.log("💡 The embeddings are now ready for search functionality.");
  } catch (error) {
    console.error("❌ Error loading CSV SKUs:", error);
    process.exit(1);
  }
}

// Run the script
loadCSVSKUs();
