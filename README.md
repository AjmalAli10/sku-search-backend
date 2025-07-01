# SKU Search Backend

A powerful backend service for SKU (Stock Keeping Unit) search functionality with advanced query normalization capabilities.

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
4. Add tests
5. Submit a pull request

## 📄 License

ISC License
