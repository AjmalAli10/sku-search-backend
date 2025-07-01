# SKU Embedding Service

A service for processing SKU (Stock Keeping Unit) data and generating embeddings using OpenAI and storing them in Chroma vector database.

## 🏗️ Architecture

The system uses a **hybrid approach** with OpenAI for embeddings and Chroma for storage:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CSV Input     │───▶│ Data Validation │───▶│ Text Generation │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Chroma Storage  │◀───│ Vector Storage  │◀───│ OpenAI Embedding│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Search/Retrieval│
└─────────────────┘
```

### **Key Components:**

- **OpenAI Embedding Service**: Generates embeddings using `text-embedding-3-small`
- **Chroma Vector DB**: Stores pre-computed embeddings (no embedding function)
- **SKU Processing Service**: Orchestrates the entire workflow
- **Data Validation**: Ensures data quality before processing

## 🚀 Features

- **SKU Data Processing**: Validate and prepare SKU data for embedding
- **OpenAI Integration**: Generate embeddings using OpenAI's text-embedding-3-small model
- **Chroma Vector Database**: Store and retrieve pre-computed embeddings (no Chroma embedding function)
- **Batch Processing**: Efficient bulk SKU loading with OpenAI batch API
- **CSV Support**: Load SKU data directly from CSV files
- **RESTful API**: Clean endpoints for SKU management
- **Data Visualization**: Web dashboard for Chroma data analysis

## 📋 Prerequisites

- Node.js 18+
- OpenAI API key
- Chroma (runs locally)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sku-search-backend
   ```

2. **Choose your setup method:**

   ### Option A: Docker Compose (Recommended)

   ```bash
   # Start both Chroma and your service
   docker-compose up -d
   ```

   ### Option B: Local Development

   ```bash
   # Install dependencies
   npm install

   # Start Chroma server (in a separate terminal)
   docker run -p 8000:8000 chromadb/chroma

   # Start your service
   npm run dev
   ```

3. **Set up environment variables**

   ```bash
   cp config/env.example .env
   ```

   Edit `.env` with your API keys:

   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Chroma Configuration
   CHROMA_PATH=http://localhost:8000
   CHROMA_COLLECTION_NAME=sku-embeddings

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

## 📦 Loading SKU Data

### From CSV File

```bash
# Place your CSV file in one of these locations:
# - ./data/skus.csv
# - ./skus.csv
# - ./data/sku_data.csv
# - ./sku_data.csv

npm run load-csv
```

## 🔍 Chroma Dashboard

Access a web-based interface to visualize your Chroma vector database:

```bash
# Start the server
npm run dev

# Open in browser
http://localhost:3000/dashboard
```

### Dashboard Features

- **📊 Real-time Statistics**: View collection overview and data quality metrics
- **📋 Data Table**: Browse SKU records with search and pagination
- **🔍 Search & Filter**: Find specific SKUs by ID, name, or category
- **📈 Data Quality**: Monitor embedding consistency and metadata completeness
- **📤 Export Data**: Download collection data for external analysis
- **🔄 Live Updates**: Refresh data in real-time

### Dashboard API Endpoints

- `GET /api/chroma/overview` - Get collection overview and statistics
- `GET /api/chroma/export` - Export data for external visualization

## 🔍 API Endpoints

### SKU Management

#### Add Single SKU

```http
POST /api/sku
Content-Type: application/json

{
  "id": 1,
  "sku": "ADH1",
  "name": "FEVICOL SH 1 KG",
  "description": "This is an adhesive SKU",
  "category_id": 1,
  "status": "Active"
}
```

#### Add Multiple SKUs

```http
POST /api/sku/batch
Content-Type: application/json

{
  "skus": [
    {
      "id": 1,
      "sku": "ADH1",
      "name": "FEVICOL SH 1 KG",
      "description": "This is an adhesive SKU"
    },
    {
      "id": 2,
      "sku": "ADH2",
      "name": "FEVICOL SH 2 KG",
      "description": "This is an adhesive SKU"
    }
  ]
}
```

#### Get Statistics

```http
GET /api/sku/stats
```

#### Delete SKU

```http
DELETE /api/sku/1
```

#### Health Check

```http
GET /health
```

## 🏗️ Services

### 1. EmbeddingService (`services/embeddingService.js`)

- Generates embeddings using OpenAI's text-embedding-3-small
- Creates comprehensive text representations of SKU data
- Supports single and batch embedding generation

### 2. ChromaVectorDBService (`services/chromaVectorDBService.js`)

- Manages Chroma vector database operations
- Handles collection initialization and management
- Provides storage and retrieval operations

### 3. SKUProcessingService (`services/skuProcessingService.js`)

- Orchestrates SKU data processing and storage
- Validates and prepares SKU data
- Manages batch operations

## 🔧 Configuration

### Environment Variables

| Variable                 | Description                   | Required                     |
| ------------------------ | ----------------------------- | ---------------------------- |
| `OPENAI_API_KEY`         | OpenAI API key for embeddings | Yes                          |
| `CHROMA_PATH`            | Chroma server path            | No (default: localhost:8000) |
| `CHROMA_COLLECTION_NAME` | Chroma collection name        | No (default: sku-embeddings) |
| `PORT`                   | Server port                   | No (default: 3000)           |
| `NODE_ENV`               | Environment mode              | No (default: development)    |

## 📊 Example Usage

### 1. Load SKU Data from CSV

```bash
npm run load-csv
```

### 2. Add Single SKU via API

```bash
curl -X POST http://localhost:3000/api/sku \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "sku": "ADH1",
    "name": "FEVICOL SH 1 KG",
    "description": "This is an adhesive SKU",
    "category_id": 1,
    "status": "Active"
  }'
```

### 3. Get Statistics

```bash
curl http://localhost:3000/api/sku/stats
```

### 4. Test Chroma Integration

```bash
npm run test-chroma
```

### 5. Test Dashboard

```bash
npm run test-dashboard
```

### 6. Test the System

```bash
npm run test-sku
```

## 🧪 Testing

Run the test suites to verify functionality:

### Test Chroma Integration

```bash
npm run test-chroma
```

This will test:

- Collection initialization
- Embedding generation
- SKU addition and retrieval
- Vector and text search
- Batch operations
- Update and delete operations

### Test Dashboard

```bash
npm run test-dashboard
```

This will test:

- Dashboard data retrieval
- Collection overview
- Sample data access
- Chart data generation
- Data export functionality

### Test SKU Processing

```bash
npm run test-sku
```

This will test:

- Health endpoint
- Single SKU addition
- Batch SKU addition
- Statistics retrieval

## 🔒 Security

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 📈 Performance

- **Batch Processing**: Efficient bulk operations
- **Vector Optimization**: Optimized embedding generation
- **Connection Pooling**: Efficient database connections

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **SSL/TLS**: Enable HTTPS
3. **Rate Limiting**: Implement API rate limiting
4. **Monitoring**: Add logging and monitoring
5. **Scaling**: Consider horizontal scaling for high traffic

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Note**: This service focuses on SKU data processing and embedding generation. Search functionality is handled by a separate service.
