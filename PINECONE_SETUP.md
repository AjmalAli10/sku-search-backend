# Pinecone Vector Database Setup Guide

This guide will help you set up Pinecone as your vector database for SKU embeddings.

## Prerequisites

1. **Pinecone Account**: Sign up for a free account at [pinecone.io](https://www.pinecone.io/)
2. **Node.js**: Version 16 or higher
3. **OpenAI API Key**: For generating embeddings

## Step 1: Get Your Pinecone API Key

1. Go to [pinecone.io](https://www.pinecone.io/) and create a free account
2. Navigate to your dashboard
3. Copy your API key from the "API Keys" section
4. Note your environment (usually "us-east-1-aws" for free tier)

## Step 2: Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=sku-embeddings

# Application Configuration
NODE_ENV=development
PORT=3000
```

## Step 3: Install Dependencies

The Pinecone client is already installed. If not, run:

```bash
npm install @pinecone-database/pinecone
```

## Step 4: Test the Setup

1. **Start the application**:

   ```bash
   npm start
   ```

2. **Load CSV data**:
   ```bash
   npm run load-csv
   ```

## Step 5: Verify Index Creation

After running the CSV loader, you should see:

```
🔧 Initializing Pinecone index: sku-embeddings
📝 Creating new index: sku-embeddings
⏳ Waiting for index to be ready...
✅ Index is ready!
✅ Pinecone index 'sku-embeddings' is ready
```

## Features

### Free Tier Limits

- **1 index** per project
- **100,000 vectors** total
- **10,000 operations** per day
- **Serverless** deployment (AWS us-east-1)

### Index Configuration

- **Dimension**: 1536 (OpenAI text-embedding-3-small)
- **Metric**: Cosine similarity
- **Cloud**: AWS (us-east-1)

## API Methods Available

### Vector Operations

- `addSKU(id, vector, metadata)` - Add single SKU
- `addBatchSKUs(skuVectors)` - Add multiple SKUs in batch
- `searchSKUs(queryVector, topK, filter)` - Search for similar SKUs
- `getSKU(id)` - Get SKU by ID
- `deleteSKU(id)` - Delete SKU by ID

### Index Management

- `initializeIndex()` - Create/connect to index
- `getIndexStats()` - Get index statistics
- `clearIndex()` - Clear all data

## Troubleshooting

### Common Issues

1. **"API key not found"**

   - Ensure `PINECONE_API_KEY` is set in your `.env` file
   - Verify the API key is correct in your Pinecone dashboard

2. **"Index not ready"**

   - New indexes take 1-5 minutes to initialize
   - Check your Pinecone dashboard for index status

3. **"Rate limit exceeded"**

   - Free tier has 10,000 operations per day
   - Consider upgrading to paid plan for higher limits

4. **"Dimension mismatch"**
   - Ensure your embeddings are 1536-dimensional (OpenAI text-embedding-3-small)
   - Check the embedding service configuration

### Getting Help

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Pinecone JavaScript SDK](https://docs.pinecone.io/docs/node)
- [Pinecone Community](https://community.pinecone.io/)

## Migration from ChromaDB

If you're migrating from ChromaDB:

1. **Data Export**: Export your existing embeddings from ChromaDB
2. **Data Import**: Use the CSV loader to re-import data to Pinecone
3. **Update Code**: The service interface remains the same
4. **Test**: Verify all search functionality works correctly

## Performance Tips

1. **Batch Operations**: Use `addBatchSKUs()` for bulk imports
2. **Filtering**: Use metadata filters to narrow search results
3. **Indexing**: Pinecone automatically handles vector indexing
4. **Caching**: Consider caching frequently accessed results

## Cost Optimization

1. **Free Tier**: Start with the free tier (100K vectors)
2. **Monitoring**: Monitor your usage in the Pinecone dashboard
3. **Cleanup**: Delete unused vectors to stay within limits
4. **Upgrade**: Scale up when you reach free tier limits
