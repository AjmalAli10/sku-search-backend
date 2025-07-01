# SKU Embedding Service

A service for processing SKU (Stock Keeping Unit) data and generating embeddings using OpenAI and storing them in Chroma vector database.
A powerful backend service for SKU (Stock Keeping Unit) search functionality with advanced query normalization capabilities.

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
## 🚀 Features

### Query Normalization System
- **Spellcheck**: Corrects spelling errors in search queries
- **ASR Fix**: Handles voice transcription errors from speech-to-text
- **Synonym Mapping**: Manages synonyms and abbreviations
- **Hindi/English Mixed Support**: Handles code-switching common in Indian context

### API Endpoints
- `POST /api/search` - Main search endpoint with normalization
- `POST /api/test-normalization` - Test normalization with multiple queries
- `POST /api/analyze-query` - Detailed query analysis
- `GET /api/health` - Health check endpoint

## 📁 Project Structure

```
/sku-search-backend
├── /normalization/
│   ├── index.js          # Main normalization module
│   ├── spellcheck.js     # Spelling correction
│   ├── synonymMap.js     # Synonym handling
│   └── asrFix.js         # ASR error correction
├── /api/
│   └── search.js         # Search API endpoints
├── index.js              # Main server file
├── test-normalization.js # Test suite
└── package.json
```

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Run in development mode
npm run dev

# Run tests
npm test
```

## 📖 Usage

### 1. Basic Search with Normalization

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "laptoop with 8 gb ram",
    "options": {
      "enableSpellcheck": true,
      "enableSynonyms": true,
      "enableASRFix": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "originalQuery": "laptoop with 8 gb ram",
  "normalizedQuery": "laptop with 8gb ram",
  "analysis": {
    "hasSpellingErrors": true,
    "hasASRErrors": false,
    "hasSynonyms": false,
    "spellingErrors": [...],
    "suggestions": [...]
  },
  "metadata": {
    "corrections": [
      {
        "type": "spellcheck",
        "original": "laptoop",
        "corrected": "laptop"
      }
    ]
  }
}
```

### 2. Test Normalization System

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
curl -X POST http://localhost:3000/api/test-normalization \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      "laptoop",
      "eye phone",
      "wi fi",
      "सस्ता laptop"
    ]
  }'
```

### 3. Analyze Query

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
curl -X POST http://localhost:3000/api/analyze-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "samsng laptoop with wi fi"
  }'
```

## 🔧 Normalization Features

### Spellcheck
- Corrects common spelling errors
- Includes SKU-specific vocabulary
- Provides spelling suggestions

**Examples:**
- `laptoop` → `laptop`
- `moblie` → `mobile`
- `computr` → `computer`

### ASR (Automatic Speech Recognition) Fix
- Handles voice transcription errors
- Corrects common misheard words
- Fixes technical term spacing

**Examples:**
- `eye phone` → `iphone`
- `wi fi` → `wifi`
- `blue tooth` → `bluetooth`
- `you are` → `u r`

### Synonym Mapping
- Manages device type synonyms
- Handles technical abbreviations
- Supports brand variations

**Examples:**
- `mobile` ↔ `phone`
- `notebook` ↔ `laptop`
- `gb` ↔ `gigabyte`
- `ram` ↔ `memory`

### Hindi/English Mixed Support
- Handles code-switching
- Translates common Hindi terms
- Maintains context

**Examples:**
- `सस्ता` → `cheap`
- `महंगा` → `expensive`
- `फोन` → `phone`

## 🧪 Testing

Run the comprehensive test suite:

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
npm test
```

This will test:
- Individual query normalization
- Query analysis
- Batch processing
- Specific scenarios
- Performance metrics

## 📊 API Reference

### POST /api/search

**Request Body:**
```json
{
  "query": "string",
  "options": {
    "enableSpellcheck": true,
    "enableSynonyms": true,
    "enableASRFix": true,
    "expandSynonyms": false,
    "returnMetadata": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "originalQuery": "string",
  "normalizedQuery": "string",
  "analysis": {
    "hasSpellingErrors": boolean,
    "hasASRErrors": boolean,
    "hasSynonyms": boolean,
    "spellingErrors": [...],
    "asrErrors": [...],
    "synonymOpportunities": [...]
  },
  "metadata": {
    "corrections": [...],
    "suggestions": [...],
    "steps": [...]
  }
}
```

### POST /api/test-normalization

**Request Body:**
```json
{
  "queries": ["string", "string", ...]
}
```

### POST /api/analyze-query

**Request Body:**
```json
{
  "query": "string"
}
```

## 🔮 Future Enhancements

- [ ] LLM integration for advanced query understanding
- [ ] Vector database integration for semantic search
- [ ] Voice transcription endpoint
- [ ] Multi-language support
- [ ] Query intent classification
- [ ] Personalized search history

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
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License
