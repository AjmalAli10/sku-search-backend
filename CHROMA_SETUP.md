# Chroma Setup Guide

This guide will help you set up Chroma for local development with your SKU embedding service.

## What is Chroma?

Chroma is an open-source embedding database that runs locally on your machine. It provides:

- **Local storage** of vector embeddings
- **Semantic search** capabilities
- **No cloud dependencies** or API costs
- **Easy setup** and management

## Installation Options

### Option 1: Docker Compose (Recommended for Development)

1. **Install Docker and Docker Compose**
2. **Run both Chroma and your SKU service**:
   ```bash
   docker-compose up -d
   ```

This will start:

- Chroma server on `http://localhost:8000`
- Your SKU service on `http://localhost:3000`

### Option 2: Docker Run (Chroma Only)

1. **Install Docker**
2. **Run Chroma server**:
   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```

### Option 3: Using Python (Alternative)

1. **Install Python 3.8+**
2. **Install Chroma**:
   ```bash
   pip install chromadb
   ```
3. **Run Chroma server**:
   ```bash
   chroma run --path /path/to/chroma/data
   ```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Chroma Configuration
CHROMA_PATH=http://localhost:8000
CHROMA_COLLECTION_NAME=sku-embeddings
```

### Default Settings

- **Server URL**: `http://localhost:8000`
- **Collection Name**: `sku-embeddings`
- **Embedding Dimension**: 1536 (OpenAI text-embedding-3-small)

## Usage

### 1. Start Chroma Server

```bash
# Option A: Docker Compose (recommended)
docker-compose up -d

# Option B: Docker Run (Chroma only)
docker run -p 8000:8000 chromadb/chroma

# Option C: Python
chroma run --path ./chroma_data
```

### 2. Load SKU Data

```bash
npm run load-csv
```

### 3. Verify Setup

Check that Chroma is running:

```bash
curl http://localhost:8000/api/v1/heartbeat
```

## Data Storage

Chroma stores data locally in:

- **Docker**: Inside the container
- **Python**: In the specified path directory

## Benefits of Chroma

### ✅ Advantages

- **Free**: No API costs or usage limits
- **Local**: Data stays on your machine
- **Fast**: Optimized for local operations
- **Simple**: Easy setup and management
- **Open Source**: Full control over the codebase

### ⚠️ Considerations

- **Local Only**: No built-in cloud sync
- **Manual Setup**: Requires server management
- **Limited Scale**: Best for small to medium datasets
- **No Built-in Backup**: Manual backup required

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Ensure Chroma server is running
   - Check port 8000 is available
   - Verify Docker container is running

2. **Collection Not Found**

   - Collection is created automatically on first use
   - Check collection name in environment variables

3. **Memory Issues**
   - Chroma stores data in memory
   - Large datasets may require more RAM
   - Consider using persistent storage

### Debug Commands

```bash
# Check if Chroma is running
curl http://localhost:8000/api/v1/heartbeat

# List collections
curl http://localhost:8000/api/v1/collections

# Get collection info
curl http://localhost:8000/api/v1/collections/sku-embeddings
```

## Migration from Pinecone

If you're migrating from Pinecone:

1. **Export data** from Pinecone (if needed)
2. **Update environment variables** (remove Pinecone, add Chroma)
3. **Re-run CSV loading** to populate Chroma
4. **Test functionality** with your data

## Next Steps

1. **Start Chroma server**
2. **Update your `.env` file**
3. **Run `npm run load-csv`**
4. **Test the system**

Your SKU embedding service is now using Chroma for local vector storage!
