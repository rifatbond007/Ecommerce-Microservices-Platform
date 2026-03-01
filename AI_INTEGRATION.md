# AI_INTEGRATION.md

## Overview

This document outlines artificial intelligence and machine learning integration opportunities across the e-commerce microservices platform. Each feature identifies the appropriate service, recommended AI/ML approach, available tools, implementation complexity, and integration strategy.

---

## Table of Contents

1. [Product Recommendation Engine](#1-product-recommendation-engine)
2. [Smart Search (Semantic Search)](#2-smart-search-semantic-search)
3. [Dynamic Pricing Suggestions](#3-dynamic-pricing-suggestions)
4. [Fraud Detection in Payments](#4-fraud-detection-in-payments)
5. [AI-Powered Customer Support Chatbot](#5-ai-powered-customer-support-chatbot)
6. [Inventory Prediction](#6-inventory-prediction)
7. [Prioritized Implementation List](#7-prioritized-implementation-list)
8. [OpenAI API and Open Source LLM Integration](#8-openai-api-and-open-source-llm-integration)

---

## 1. Product Recommendation Engine

### Service: Product Service

### AI/ML Approach

**Primary: Collaborative Filtering + Content-Based Filtering (Hybrid)**

| Approach | Description | Use Case |
|----------|-------------|----------|
| Collaborative Filtering | "Users who bought X also bought Y" based on user behavior | Product suggestions |
| Content-Based Filtering | Recommend based on product attributes similarity | Similar product matching |
| Matrix Factorization (SVD) | Latent factor model for user-item matrix | Personalized ranking |
| Deep Learning Embeddings | Neural networks for user and product embeddings | Advanced personalization |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [LensKit](https://lenskit.org/) | Python Library | Open-source recommender system |
| [Surprise](https://surpriselib.com/) | Python Library | Simple collaborative filtering |
| [TensorFlow Recommenders](https://www.tensorflow.org/recommenders) | Google ML Library | Production-grade recommendations |
| [Implicit](https://implicit.github.io/) | Python Library | Fast collaborative filtering |
| [Apache Spark MLlib](https://spark.apache.org/mllib/) | Big Data ML | Large-scale recommendations |

### Implementation Complexity: **Medium**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Product Service │────▶│  Recommendation  │────▶│   Redis Cache   │
│   (Express.js)   │     │    Service       │     │                 │
└─────────────────┘     │  (Python/Flask)  │     └─────────────────┘
                       └──────────────────┘               │
                               │                          │
                               ▼                          ▼
                       ┌──────────────────┐     ┌─────────────────┐
                       │  RabbitMQ        │     │  API Gateway    │
                       │  Events          │     │                 │
                       └──────────────────┘     └─────────────────┘
```

### Implementation Details

1. **Data Collection Pipeline**
   - Track user events: views, clicks, adds to cart, purchases
   - Store events in PostgreSQL and sync to recommendation service
   - Use RabbitMQ for real-time event streaming

2. **Model Training**
   - Train collaborative filtering model nightly
   - Use Python service with TensorFlow/PyTorch
   - Store model artifacts in filesystem or ML registry

3. **Serving Layer**
   - Pre-compute recommendations for active users
   - Cache in Redis with TTL
   - Real-time inference via REST API

### Code Integration Example

```javascript
// Product Service - GET /products/:id/recommendations
const axios = require('axios');

async function getRecommendations(productId, userId, limit = 10) {
  const cacheKey = `recommendations:${userId}:${productId}`;
  
  // Check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Call recommendation service
  const response = await axios.get(
    `${process.env.RECOMMENDATION_SERVICE_URL}/recommend`,
    { params: { productId, userId, limit } }
  );
  
  // Cache results for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(response.data));
  
  return response.data;
}
```

---

## 2. Smart Search (Semantic Search)

### Service: Search Service

### AI/ML Approach

**Primary: Semantic Search with Vector Embeddings**

| Approach | Description | Use Case |
|----------|-------------|----------|
| Dense Retrieval (DPR) | Dense passage retrieval for semantic matching | Product search |
| BM25 + Learned Ranking | Hybrid keyword + ML ranking | Search ranking |
| Sentence Transformers | Generate semantic embeddings | Query understanding |
| Elasticsearch with ESRE | Enterprise semantic search | Production deployment |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [Meilisearch](https://www.meilisearch.com/) | Search Engine | Typo-tolerant, fast search |
| [Typesense](https://typesense.org/) | Search Engine | Open-source instant search |
| [Qdrant](https://qdrant.tech/) | Vector Database | Semantic search storage |
| [Sentence-Transformers](https://sbert.net/) | Python Library | Generate embeddings |
| [Hugging Face Transformers](https://huggingface.co/) | ML Models | Pre-trained embedding models |
| [ Elasticsearch with ESRE](https://www.elastic.co/) | Search Engine | Enterprise semantic search |

### Implementation Complexity: **Medium to Hard**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Search Service │────▶│  Embedding      │────▶│   Qdrant/       │
│   (Express.js)   │     │  Service         │     │   Elasticsearch │
└─────────────────┘     │  (Python)        │     └─────────────────┘
                       └──────────────────┘               │
                               │                          │
                               ▼                          ▼
                       ┌──────────────────┐     ┌─────────────────┐
                       │  Product Service  │     │   Redis Cache   │
                       │  (RabbitMQ)       │     │                 │
                       └──────────────────┘     └─────────────────┘
```

### Implementation Details

1. **Embedding Generation**
   - Use sentence-transformers model (all-MiniLM-L6-v2)
   - Generate embeddings for product names, descriptions, attributes
   - Store vectors in Qdrant or Elasticsearch

2. **Search Pipeline**
   - Receive search query via REST API
   - Generate query embedding
   - Perform vector similarity search
   - Combine with keyword matching (BM25)
   - Apply learning-to-rank model

3. **Synonym and Autocomplete**
   - Maintain synonym mappings
   - Use prefix trie for autocomplete
   - Learn from search logs

### Code Integration Example

```javascript
// Search Service - GET /search
const { QdrantClient } = require('@qdrant/js-client-rest');

async function semanticSearch(query, filters, limit = 20) {
  // Generate query embedding
  const embeddingResponse = await axios.post(
    `${process.env.EMBEDDING_SERVICE_URL}/embed`,
    { text: query }
  );
  const queryVector = embeddingResponse.data.embedding;
  
  // Search in vector database
  const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
  const results = await qdrant.search('products', {
    vector: queryVector,
    limit,
    filter: convertFiltersToQdrant(filters),
    with_payload: true
  });
  
  // Apply business rules and return
  return formatSearchResults(results);
}
```

---

## 3. Dynamic Pricing Suggestions

### Service: Product Service

### AI/ML Approach

**Primary: Demand Forecasting + Price Elasticity Models**

| Approach | Description | Use Case |
|----------|-------------|----------|
| Time Series Forecasting | ARIMA, Prophet, LSTM | Demand prediction |
| Price Elasticity Models | Measure price sensitivity | Optimal pricing |
| Reinforcement Learning | Dynamic pricing agent | Real-time adjustments |
| Competitive Pricing | Monitor competitor prices | Market positioning |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [Prophet](https://facebook.github.io/prophet/) | Time Series Forecasting | Demand forecasting |
| [Statsmodels](https://www.statsmodels.org/) | Statistical Models | Price elasticity |
| [Optuna](https://optuna.org/) | Hyperparameter Optimization | Model tuning |
| [PyTorch](https://pytorch.org/) | Deep Learning | RL-based pricing |
| [MLflow](https://mlflow.org/) | ML Lifecycle | Model tracking |

### Implementation Complexity: **Hard**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Product Service │◀────│  Pricing Engine  │◀────│  Analytics      │
│   (Express.js)   │     │  (Python/FastAPI) │     │  Pipeline       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Redis Cache    │     │  MLflow Registry │
│  (Price Rules)  │     │  (Model Storage) │
└─────────────────┘     └──────────────────┘
```

### Implementation Details

1. **Data Requirements**
   - Historical sales data (orders, quantities)
   - Competitor pricing data (external APIs, scraping)
   - Product costs and margins
   - Seasonal patterns and events

2. **Model Training**
   - Train demand forecasting model weekly
   - Calculate price elasticity per product category
   - A/B test pricing suggestions

3. **Pricing Rules Engine**
   - Define floor/ceiling prices
   - Apply competitor-based adjustments
   - Consider inventory levels
   - Respect promotional strategies

### Pricing Suggestion Output

```json
{
  "product_id": "uuid",
  "current_price": 99.99,
  "suggested_price": 94.99,
  "confidence": 0.85,
  "reason": "High inventory, upcoming competitor sale",
  "expected_revenue_change": "+12%",
  "valid_until": "2026-03-15T00:00:00Z"
}
```

---

## 4. Fraud Detection in Payments

### Service: Payment Service

### AI/ML Approach

**Primary: Anomaly Detection + Classification**

| Approach | Description | Use Case |
|----------|-------------|----------|
| Random Forest | Feature-based classification | Transaction scoring |
| Isolation Forest | Anomaly detection | Unusual patterns |
| Graph Neural Networks | Relationship analysis | Collusion detection |
| Behavioral Biometrics | Device fingerprinting | Account takeover |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [Scikit-learn](https://scikit-learn.org/) | ML Library | Classification models |
| [PyOD](https://pyod.readthedocs.io/) | Anomaly Detection | Outlier detection |
| [Great Expectations](https://greatexpectations.io/) | Data Quality | Feature engineering |
| [Feast](https://feast.dev/) | Feature Store | Real-time features |
| [Elyra](https://elyra.ai/) | Pipelines | ML pipeline orchestration |

### Implementation Complexity: **Medium to Hard**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Payment Service │────▶│  Fraud Detection │────▶│  Payment        │
│   (Express.js)   │     │  Service         │     │  Gateway        │
└─────────────────┘     │  (Python)        │     └─────────────────┘
                       └──────────────────┘               │
                               │                          │
                               ▼                          ▼
                       ┌──────────────────┐     ┌─────────────────┐
                       │  Redis (Real-time│     │  PostgreSQL     │
                       │  Features)       │     │  (Labels)       │
                       └──────────────────┘     └─────────────────┘
```

### Implementation Details

1. **Feature Engineering**
   - Transaction amount and frequency
   - User velocity (transactions per hour/day)
   - Device fingerprint
   - Geographic location anomalies
   - Historical transaction patterns

2. **Model Inference**
   - Pre-transaction scoring (real-time)
   - Post-transaction batch analysis
   - Escalation rules for high-risk

3. **Risk Scoring Response**

```json
{
  "transaction_id": "uuid",
  "risk_score": 0.78,
  "risk_level": "high",
  "factors": [
    { "name": "velocity_high", "contribution": 0.4 },
    { "name": "new_account", "contribution": 0.25 },
    { "name": "unusual_location", "contribution": 0.35 }
  ],
  "recommendation": "block",
  "requires_verification": true
}
```

### Code Integration Example

```javascript
// Payment Service - POST /payments
async function createPayment(paymentData) {
  // Get real-time risk score
  const fraudCheck = await axios.post(
    `${process.env.FRAUD_SERVICE_URL}/score`,
    {
      user_id: paymentData.user_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      card_last_four: paymentData.card_last_four,
      billing_address: paymentData.billing_address,
      shipping_address: paymentData.shipping_address,
      device_fingerprint: paymentData.device_fingerprint,
      ip_address: paymentData.ip_address
    }
  );
  
  if (fraudCheck.data.risk_score > 0.9) {
    throw new Error('Transaction blocked due to high fraud risk');
  }
  
  if (fraudCheck.data.requires_verification) {
    // Trigger 3D Secure or OTP
    await triggerVerification(paymentData);
  }
  
  // Proceed with payment processing
  return processPayment(paymentData);
}
```

---

## 5. AI-Powered Customer Support Chatbot

### Service: Notification Service (or dedicated Customer Service)

### AI/ML Approach

**Primary: Large Language Model (LLM) + Retrieval-Augmented Generation (RAG)**

| Approach | Description | Use Case |
|----------|-------------|----------|
| RAG (Retrieval-Augmented Generation) | Knowledge base + LLM | Product/order queries |
| Intent Classification | Classify user intent | Route to appropriate handler |
| Named Entity Recognition | Extract order IDs, products | Order status, refunds |
| Sentiment Analysis | Detect user emotion | Priority routing |
| Conversation Summarization | Summarize interactions | Handoff to human agents |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [LangChain](https://langchain.com/) | LLM Framework | Build RAG applications |
| [LlamaIndex](https://www.llamaindex.ai/) | Data Framework | RAG pipeline |
| [Ollama](https://ollama.com/) | Local LLM | Self-hosted LLMs |
| [Hugging Face Chat UI](https://huggingface.co/chat) | Chat Interface | Open-source chat |
| [RAGAS](https://ragas.io/) | RAG Evaluation | Benchmark RAG systems |
| [Chatwoot](https://www.chatwoot.com/) | Customer Support | Open-source support |

### Implementation Complexity: **Medium to Hard**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Notification   │────▶│  Chatbot Service  │────▶│  LLM Provider   │
│  Service        │     │  (Express.js +    │     │  (OpenAI/       │
│  (Express.js)   │     │   Python/FastAPI) │     │   Ollama)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                       ┌──────────────────┐     ┌─────────────────┐
                       │  Vector Database │     │  Product Service│
                       │  (Knowledge Base)│     │  Order Service  │
                       └──────────────────┘     └─────────────────┘
```

### Implementation Details

1. **Knowledge Base**
   - Product information, FAQs, policies
   - Convert to embeddings and store in vector DB
   - Update as products/policies change

2. **Conversation Flow**
   - Classify user intent
   - Retrieve relevant context from knowledge base
   - Generate response with LLM
   - Escalate to human agent when needed

3. **Integration Points**

```javascript
// Chatbot API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, session_id, user_id } = req.body;
  
  // 1. Classify intent
  const intent = await classifyIntent(message);
  
  // 2. Extract entities (order ID, product name, etc.)
  const entities = await extractEntities(message);
  
  // 3. Retrieve relevant context
  const context = await retrieveContext(message, intent, entities);
  
  // 4. Generate response using RAG
  const response = await generateResponse(
    message,
    context,
    conversationHistory
  );
  
  // 5. Log for improvement
  await logConversation(user_id, message, response, intent);
  
  return res.json({ response, intent, escalate: response.needs_escalation });
});
```

### Supported Capabilities

| Intent | Example Query | Response Source |
|--------|---------------|-----------------|
| Order Status | "Where's my order?" | Order Service API |
| Product Info | "Tell me about iPhone 15" | Product Service API |
| Returns | "How do I return a product?" | Knowledge Base |
| Refunds | "When will I get my refund?" | Order Service API |
| Troubleshooting | "Payment failed" | Knowledge Base + Support Docs |

---

## 6. Inventory Prediction

### Service: Product Service

### AI/ML Approach

**Primary: Time Series Forecasting + Demand Planning**

| Approach | Description | Use Case |
|----------|-------------|----------|
| ARIMA/SARIMA | Classical time series | Seasonal demand |
| Prophet | Facebook's forecasting tool | Trend + seasonality |
| XGBoost | Gradient boosting | Multi-factor forecasting |
| LSTM | Deep learning | Complex patterns |
| Supply Chain Simulation | Monte Carlo | Risk assessment |

### Free/Open Source Tools

| Tool | Type | Description |
|------|------|-------------|
| [Prophet](https://facebook.github.io/prophet/) | Forecasting | Demand forecasting |
| [Statsmodels](https://www.statsmodels.org/) | Statistics | ARIMA, exponential smoothing |
| [Darts](https://unit8co.github.io/darts/) | Time Series | Unified time series ML |
| [Optuna](https://optuna.org/) | Optimization | Hyperparameter tuning |
| [Pandas](https://pandas.pydata.org/) | Data Processing | Data preparation |

### Implementation Complexity: **Medium**

### Integration with Node.js Services

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Product Service │◀────│  Inventory       │◀────│  Order Service  │
│   (Express.js)   │     │  Prediction       │     │  (Historical    │
└─────────────────┘     │  (Python/FastAPI) │     │   Data)         │
                       └──────────────────┘     └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │  Admin Service    │
                       │  (Dashboards)     │
                       └──────────────────┘
```

### Implementation Details

1. **Data Inputs**
   - Historical sales by product/variant
   - Inventory levels by warehouse
   - Marketing campaigns and promotions
   - External factors (holidays, events)

2. **Prediction Output**

```json
{
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "predictions": [
    {
      "date": "2026-03-15",
      "forecasted_demand": 150,
      "confidence_interval": [120, 180],
      "reorder_recommendation": true,
      "recommended_reorder_quantity": 200
    }
  ],
  "model_accuracy": {
    "mape": 0.12,
    "rmse": 15.3
  }
}
```

3. **Alert System**
   - Predicted stockouts trigger alerts
   - Automated reorder suggestions
   - Overstock warnings

---

## 7. Prioritized Implementation List

Based on business value, implementation complexity, and dependency analysis:

### Priority Order

| Rank | Feature | Service | Complexity | Business Impact | Justification |
|------|---------|---------|------------|-----------------|----------------|
| 1 | Smart Search | Search Service | Medium | **High** | Immediate customer experience improvement, relatively straightforward |
| 2 | Product Recommendations | Product Service | Medium | **High** | Proven revenue driver, builds on search infrastructure |
| 3 | AI Chatbot | Notification Service | Medium-Hard | **High** | Reduces support costs, 24/7 availability |
| 4 | Fraud Detection | Payment Service | Medium-Hard | **High** | Prevents revenue loss, essential for payment security |
| 5 | Inventory Prediction | Product Service | Medium | **Medium** | Operational efficiency, reduces stockouts/overstock |
| 6 | Dynamic Pricing | Product Service | Hard | **Medium** | Requires mature data infrastructure, complex business rules |

### Implementation Roadmap

```
Month 1-2: Smart Search
├── Set up embedding service
├── Configure Qdrant/Elasticsearch
├── Implement search API
└── Integrate with frontend

Month 3-4: Product Recommendations
├── Build event collection pipeline
├── Train collaborative filtering model
├── Create recommendation API
└── A/B test recommendations

Month 5-6: AI Chatbot
├── Set up knowledge base
├── Configure LLM (OpenAI/Ollama)
├── Build RAG pipeline
└── Integrate with support system

Month 7-8: Fraud Detection
├── Feature engineering pipeline
├── Train anomaly detection model
├── Integrate with payment flow
└── Monitor and tune

Month 9-10: Inventory Prediction
├── Aggregate historical data
├── Train forecasting models
├── Build dashboard for admins
└── Set up alerts

Month 11-12: Dynamic Pricing
├── Gather competitive data
├── Build pricing rules engine
├── Train elasticity models
└── Gradual rollout with controls
```

---

## 8. OpenAI API and Open Source LLM Integration

### Option 1: OpenAI API Integration

#### API Key Setup

```javascript
// .env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORGANIZATION=org-xxxxxxxxxxxxxxxxxxxx
```

#### Integration Code

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION
});

async function generateChatResponse(messages, context) {
  const systemPrompt = `You are a helpful e-commerce customer support agent.
  Use the following context to answer questions:
  ${context}
  
  Guidelines:
  - Be concise and friendly
  - If you don't know something, say so
  - Always be accurate about order status and products
  - Suggest human agent for complex issues`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
}
```

#### Cost Management

| Model | Use Case | Input Cost | Output Cost |
|-------|----------|-------------|-------------|
| GPT-4 Turbo | Complex reasoning, chatbot | $10/1M | $30/1M |
| GPT-3.5 Turbo | Simple queries, intent classification | $0.5/1M | $1.5/1M |
| GPT-4o | Multimodal (images in queries) | $5/1M | $15/1M |

#### Best Practices

1. **Caching**: Cache frequent queries to reduce API calls
2. **Fallback**: Have fallback responses when API is unavailable
3. **Rate Limiting**: Implement request throttling
4. **Monitoring**: Track API usage and costs
5. **Prompt Engineering**: Optimize prompts for cost and accuracy

---

### Option 2: Open Source LLM (Self-Hosted)

#### Recommended Open Source Models

| Model | Parameters | Use Case | Hardware Requirements |
|-------|------------|-----------|----------------------|
| [Llama 3](https://llama.meta.com/llama3/) | 8B-70B | General purpose | 16-512GB RAM |
| [Mistral](https://mistral.ai/) | 7B | Fast inference | 16GB RAM |
| [Qwen](https://qwenlm.github.io/) | 7B-72B | Multilingual | 16-512GB RAM |
| [Phi-3](https://azure.microsoft.com/) | 3.8B | Lightweight | 8GB RAM |
| [Mixtral](https://mistral.ai/) | 8x7B | High quality | 128GB RAM |

#### Self-Hosted Setup with Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3
ollama pull mistral

# Run the server
ollama serve
```

#### Node.js Integration with Ollama

```javascript
const axios = require('axios');

async function generateWithOllama(prompt, model = 'llama3') {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model,
    prompt,
    stream: false
  });
  
  return response.data.response;
}

// For chat-style interactions
async function chatWithOllama(messages, model = 'llama3') {
  const response = await axios.post('http://localhost:11434/api/chat', {
    model,
    messages
  });
  
  return response.data.message.content;
}
```

#### Open Source RAG Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     RAG Architecture                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Query ──▶ Embedding Model ──▶ Vector Database        │
│                      │                    │                  │
│                      ▼                    ▼                  │
│              (sentence-transformers)   (Qdrant)             │
│                                             │                  │
│                                             ▼                  │
│                                      Retrieve Context        │
│                                             │                  │
│                                             ▼                  │
│              LLM (Ollama/OpenAI) ◀── Combine with Prompt     │
│                                             │                  │
│                                             ▼                  │
│                                      Generate Response       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### RAG Implementation

```javascript
const { QdrantClient } = require('@qdrant/js-client-rest');
const { pipeline } = require('@xenova/transformers');

// Initialize components
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

// Embedding function (using lightweight model)
async function getEmbedding(text) {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output);
}

// RAG query
async function ragQuery(userQuery) {
  // 1. Get query embedding
  const queryEmbedding = await getEmbedding(userQuery);
  
  // 2. Retrieve relevant documents
  const results = await qdrant.search('knowledge_base', {
    vector: queryEmbedding,
    limit: 5
  });
  
  // 3. Build context from results
  const context = results.map(r => r.payload.content).join('\n\n');
  
  // 4. Generate response (using Ollama)
  const prompt = `Use this context to answer the question.
  
Context:
${context}

Question: ${userQuery}

Answer:`;
  
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama3',
    prompt,
    stream: false
  });
  
  return {
    answer: response.data.response,
    sources: results.map(r => r.payload.source)
  };
}
```

### Decision Matrix: OpenAI vs. Self-Hosted

| Factor | OpenAI API | Self-Hosted (Ollama) |
|--------|------------|---------------------|
| Setup Time | Hours | Days to weeks |
| Initial Cost | Pay-per-use | Hardware investment |
| Ongoing Cost | Variable (usage-based) | Fixed (electricity, maintenance) |
| Data Privacy | Data sent to OpenAI | Full control |
| Customization | Limited | Full fine-tuning |
| Latency | Variable (network) | Lower (local) |
| Maintenance | None | Requires ML expertise |
| Scalability | Unlimited | Hardware-dependent |
| Best For | Startups, MVP | Enterprise, privacy requirements |

### Hybrid Approach (Recommended)

```javascript
// Use OpenAI for complex queries, local model for simple ones
async function smartChatbot(query, userTier) {
  const intent = await classifyIntent(query);
  
  if (intent.complexity === 'low' && !userTier.is_premium) {
    // Use local Ollama for simple queries
    return chatWithOllama(query);
  } else {
    // Use OpenAI for complex queries or premium users
    return generateWithOpenAI(query);
  }
}
```

---

## Summary

This document outlines six key AI integration opportunities for the e-commerce platform:

1. **Product Recommendation Engine** - Personalized product suggestions using collaborative filtering
2. **Smart Search** - Semantic search using vector embeddings for better product discovery
3. **Dynamic Pricing** - AI-driven pricing optimization based on demand and competition
4. **Fraud Detection** - Real-time transaction scoring to prevent payment fraud
5. **AI Chatbot** - LLM-powered customer support with RAG for accurate responses
6. **Inventory Prediction** - Demand forecasting to optimize stock levels

**Recommended First Implementation**: Smart Search, as it provides immediate customer value and establishes infrastructure (embeddings, vector DB) needed for other AI features.

**LLM Strategy**: Start with OpenAI API for rapid prototyping, then evaluate self-hosted options based on privacy requirements, scale, and budget. A hybrid approach offers the best balance of speed and cost.

---

*Last Updated: 2026*
