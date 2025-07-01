import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

/**
 * Test adding a single SKU
 */
async function testAddSingleSKU() {
  try {
    console.log("🧪 Testing single SKU addition...");

    const skuData = {
      id: 999,
      sku: "TEST001",
      name: "Test Product 1 KG",
      description: "This is a test adhesive product",
      category_id: 1,
      mrp: 150.0,
      selling_price: 120.0,
      status: "Active",
      is_active: 1,
    };

    const response = await fetch(`${API_BASE_URL}/api/sku`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(skuData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Single SKU added successfully:", data);
  } catch (error) {
    console.error("❌ Error adding single SKU:", error.message);
  }
}

/**
 * Test adding multiple SKUs in batch
 */
async function testAddBatchSKUs() {
  try {
    console.log("\n🧪 Testing batch SKU addition...");

    const skuDataArray = [
      {
        id: 1001,
        sku: "TEST002",
        name: "Test Product 2 KG",
        description: "This is another test adhesive product",
        category_id: 1,
        mrp: 280.0,
        selling_price: 220.0,
        status: "Active",
        is_active: 1,
      },
      {
        id: 1002,
        sku: "TEST003",
        name: "Test Product 5 KG",
        description: "This is a larger test adhesive product",
        category_id: 1,
        mrp: 650.0,
        selling_price: 520.0,
        status: "Active",
        is_active: 1,
      },
    ];

    const response = await fetch(`${API_BASE_URL}/api/sku/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ skus: skuDataArray }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Batch SKUs added successfully:", data);
  } catch (error) {
    console.error("❌ Error adding batch SKUs:", error.message);
  }
}

/**
 * Test getting statistics
 */
async function testGetStats() {
  try {
    console.log("\n🧪 Testing statistics endpoint...");

    const response = await fetch(`${API_BASE_URL}/api/sku/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Statistics retrieved successfully:");
    console.log("📊 Vector DB Stats:", data.stats);
    console.log("🧠 Embedding Model:", data.modelInfo);
  } catch (error) {
    console.error("❌ Error getting statistics:", error.message);
  }
}

/**
 * Test health endpoint
 */
async function testHealth() {
  try {
    console.log("\n🧪 Testing health endpoint...");

    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Health check passed:", data);
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🚀 Starting SKU Processing Tests...\n");

  // Test health first
  await testHealth();

  // Test single SKU addition
  await testAddSingleSKU();

  // Test batch SKU addition
  await testAddBatchSKUs();

  // Test statistics
  await testGetStats();

  console.log("\n✅ All tests completed!");
}

// Run tests
runTests().catch(console.error);
