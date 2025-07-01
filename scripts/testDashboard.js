import dotenv from "dotenv";
import ChromaVisualizationService from "../services/chromaVisualizationService.js";

// Load environment variables
dotenv.config();

async function testDashboard() {
  try {
    console.log("🧪 Testing Chroma Dashboard...");

    const visualizationService = new ChromaVisualizationService();

    // Test 1: Get collection overview
    console.log("\n1️⃣ Testing collection overview...");
    const overview = await visualizationService.getCollectionOverview();
    console.log("✅ Collection overview retrieved successfully");
    console.log("📊 Collection stats:", {
      name: overview.collection?.name,
      totalVectors: overview.collection?.totalVectors,
      dimension: overview.collection?.dimension,
    });

    // Test 2: Get sample data
    console.log("\n2️⃣ Testing sample data retrieval...");
    const sampleData = await visualizationService.getSampleData(5);
    console.log(`✅ Retrieved ${sampleData.length} sample records`);

    if (sampleData.length > 0) {
      console.log("📋 Sample record:", {
        id: sampleData[0].id,
        metadata: sampleData[0].metadata,
        documentLength: sampleData[0].document?.length || 0,
      });
    }

    // Test 3: Get chart data
    console.log("\n3️⃣ Testing chart data generation...");
    const chartData = await visualizationService.getChartData();
    console.log("✅ Chart data generated successfully");
    console.log("📈 Chart data:", {
      totalRecords: chartData.totalRecords,
      qualityScore: chartData.qualityScore,
      categories: chartData.categories?.labels?.length || 0,
    });

    // Test 4: Export data
    console.log("\n4️⃣ Testing data export...");
    const exportData = await visualizationService.exportForVisualization(10);
    console.log("✅ Data export successful");
    console.log("📤 Export info:", {
      totalRecords: exportData.metadata?.totalRecords,
      exportedRecords: exportData.metadata?.exportedRecords,
      collectionName: exportData.metadata?.collectionName,
    });

    console.log("\n🎉 Dashboard tests completed successfully!");
    console.log(
      "🌐 You can now access the dashboard at: http://localhost:3000/dashboard"
    );
  } catch (error) {
    console.error("❌ Dashboard test failed:", error);
    process.exit(1);
  }
}

// Run the test
testDashboard();
