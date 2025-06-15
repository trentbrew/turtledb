# 🧠 Embeddings & Semantic Search Guide

TurtleDB's semantic search capabilities are powered by real AI embeddings that
understand meaning, not just keywords. This guide will teach you how to leverage
this powerful feature.

## 🎯 What Are Embeddings?

Embeddings are numerical representations of text that capture semantic meaning.
TurtleDB uses the `all-MiniLM-L6-v2` model to generate 384-dimensional vectors
that understand:

- **Synonyms**: "car" and "automobile" have similar embeddings
- **Context**: "bank" (financial) vs "bank" (river) have different embeddings
- **Relationships**: "doctor" and "medicine" are semantically related
- **Concepts**: "artificial intelligence" and "machine learning" cluster
  together

## ⚡ How TurtleDB Generates Embeddings

### Automatic Generation

Every time you create a node, TurtleDB automatically:

1. **Extracts semantic content** from your node data
2. **Combines relevant fields** into a description
3. **Generates embeddings** using the AI model
4. **Stores vectors** for instant search

```javascript
// When you create this node...
const article = await graph.createNode("article", {
  title: "Introduction to Machine Learning",
  content: "Machine learning is a subset of artificial intelligence...",
  category: "technology",
});

// TurtleDB automatically:
// 1. Combines: "Introduction to Machine Learning. Machine learning is a subset..."
// 2. Generates: [0.123, -0.456, 0.789, ...] (384 dimensions)
// 3. Stores: Ready for semantic search!
```

### What Gets Embedded

TurtleDB intelligently selects content for embedding:

```javascript
// For this node type...
article: {
  data: {
    title: { type: 'string', required: true },        // ✅ Embedded
    content: { type: 'string', required: true },      // ✅ Embedded
    category: { type: 'string', required: true },     // ✅ Embedded
    tags: { type: 'array', required: false },         // ✅ Embedded
    publishedAt: { type: 'string', required: false }, // ❌ Not embedded (timestamp)
    viewCount: { type: 'number', required: false }    // ❌ Not embedded (metric)
  }
}

// Results in embedding text like:
// "Introduction to Machine Learning. Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models. technology. javascript, tutorial, beginner"
```

## 🔍 Semantic Search in Action

### Basic Search

```javascript
// Search by meaning, not exact keywords
const results = await graph.searchNodes("artificial intelligence", 5);

// Returns nodes ranked by semantic similarity:
results.forEach((result) => {
  console.log(
    `${result.node.data.title}: ${(result.similarity * 100).toFixed(1)}% match`,
  );
});

// Example output:
// "Deep Learning Tutorial": 87.3% match
// "Neural Networks Explained": 82.1% match
// "Machine Learning Basics": 78.9% match
// "AI in Healthcare": 71.2% match
// "Computer Vision Guide": 68.4% match
```

### Advanced Search Patterns

#### Conceptual Search

```javascript
// Search for concepts, not just keywords
const aiConcepts = await graph.searchNodes("intelligent systems", 10);
const healthConcepts = await graph.searchNodes("medical diagnosis", 10);
const webConcepts = await graph.searchNodes("user interface design", 10);

// Each finds semantically related content, even without exact keyword matches
```

#### Multi-Modal Search

```javascript
// Search across different node types
const allResults = await graph.searchNodes("data visualization", 10);

// Might return:
// - Articles about charts and graphs
// - People with data science skills
// - Projects involving analytics
// - Tools for creating visualizations
```

#### Contextual Search

```javascript
// Same words, different contexts
const bankFinancial = await graph.searchNodes("bank financial services", 5);
const bankRiver = await graph.searchNodes("bank river water", 5);

// Returns completely different results based on context!
```

## 📊 Understanding Similarity Scores

Similarity scores range from 0 to 1, where:

- **0.8-1.0**: Extremely similar (near-duplicates or highly related)
- **0.6-0.8**: Very similar (same topic, different angle)
- **0.4-0.6**: Moderately similar (related concepts)
- **0.2-0.4**: Somewhat similar (loose connection)
- **0.0-0.2**: Not similar (different topics)

### Real-World Examples

Based on our testing with diverse content:

```javascript
// High similarity (same domain)
"Machine Learning Tutorial" ↔ "Deep Learning Guide": 0.486 (48.6%)
"Medical AI Research" ↔ "Healthcare Analytics": 0.347 (34.7%)

// Low similarity (different domains)
"AI Technology" ↔ "Italian Cooking": 0.012 (1.2%)
"Web Development" ↔ "Medical Research": 0.034 (3.4%)
```

## 🎛️ Customizing Embeddings

### Custom Embedding Function

You can provide your own embedding function:

```javascript
import { GraphCore } from "turtle-db";

// Custom embedding function
async function customEmbedding(text) {
  // Use your preferred embedding service
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// Use custom function
const graph = new GraphCore(schema, {
  embeddingFn: customEmbedding,
});
```

### Fallback Strategy

TurtleDB includes graceful fallback:

```javascript
// If real embeddings fail, TurtleDB falls back to deterministic embeddings
// This ensures your app keeps working even if the AI model is unavailable

const graph = new GraphCore(schema, {
  embeddingFn: async (text) => {
    try {
      return await realEmbeddingFunction(text);
    } catch (error) {
      console.warn("Real embeddings failed, using fallback");
      return null; // TurtleDB will use deterministic fallback
    }
  },
});
```

## 🔗 Soft Links: Automatic Relationship Discovery

Soft links use embeddings to discover hidden relationships in your data:

### Generating Soft Links

```javascript
// After populating your graph with data
await graph.generateSoftLinks();

// Access discovered relationships
graph.softLinks.forEach((link) => {
  const source = graph.getNodes().find((n) => n.id === link.sourceId);
  const target = graph.getNodes().find((n) => n.id === link.targetId);

  console.log(
    `"${source.data.title}" ↔ "${target.data.title}" (${
      (link.score * 100).toFixed(1)
    }% similar)`,
  );
});

// Example output:
// "Machine Learning Guide" ↔ "AI Research Paper" (73.2% similar)
// "Web Development Tutorial" ↔ "Frontend Framework Guide" (68.9% similar)
```

### Configuring Soft Link Thresholds

```javascript
// Only create soft links above a certain similarity threshold
await graph.generateSoftLinks(0.5); // 50% minimum similarity

// Or use different thresholds for different node types
const customSoftLinks = graph.getNodes()
  .filter((node) => node.type === "article")
  .map(async (node) => {
    const similar = await graph.searchNodes(node.embedding, 5);
    return similar
      .filter((result) => result.similarity > 0.6) // Higher threshold for articles
      .map((result) => ({
        sourceId: node.id,
        targetId: result.node.id,
        score: result.similarity,
        type: "semantic_similarity",
      }));
  });
```

## 🚀 Performance Optimization

### Embedding Performance

TurtleDB's embedding system is optimized for production:

- **Speed**: 3-7ms per embedding generation
- **Memory**: 23MB total (including model)
- **Offline**: No server dependencies after model download
- **Caching**: Embeddings are cached and persisted

### Search Performance

```javascript
// Search is fast - embeddings are pre-computed
console.time("semantic-search");
const results = await graph.searchNodes("machine learning", 10);
console.timeEnd("semantic-search");
// Typical output: semantic-search: 2.341ms
```

### Batch Operations

For large datasets, consider batch operations:

```javascript
// Instead of creating nodes one by one...
for (const item of largeDataset) {
  await graph.createNode("article", item); // Slow: generates embeddings individually
}

// Consider batching (if you have many similar items)
const articles = largeDataset.map((item) => ({
  type: "article",
  data: item,
}));

// Create nodes in batches
for (let i = 0; i < articles.length; i += 10) {
  const batch = articles.slice(i, i + 10);
  await Promise.all(
    batch.map((article) => graph.createNode(article.type, article.data)),
  );
}
```

## 🎯 Best Practices

### Content Optimization

#### Rich Descriptions

```javascript
// Good: Rich semantic content
const goodArticle = await graph.createNode("article", {
  title: "Introduction to Machine Learning",
  content:
    "Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.",
  category: "technology",
  tags: ["AI", "machine learning", "algorithms", "data science"],
  summary:
    "A comprehensive guide covering the fundamentals of machine learning, including supervised and unsupervised learning techniques.",
});

// Less ideal: Sparse content
const sparseArticle = await graph.createNode("article", {
  title: "ML Guide",
  content: "About ML.",
  category: "tech",
});
```

#### Meaningful Categories

```javascript
// Use descriptive categories that add semantic value
const schema = {
  node_types: {
    article: {
      data: {
        category: {
          type: "string",
          enum: [
            "artificial intelligence", // ✅ Descriptive
            "web development", // ✅ Descriptive
            "data science", // ✅ Descriptive
            "healthcare technology", // ✅ Descriptive
          ],
        },
      },
    },
  },
};

// Instead of generic categories
const genericSchema = {
  node_types: {
    article: {
      data: {
        category: {
          type: "string",
          enum: ["tech", "business", "other"], // ❌ Too generic
        },
      },
    },
  },
};
```

### Search Strategies

#### Progressive Search

```javascript
// Start broad, then narrow down
async function progressiveSearch(query) {
  // First: broad search
  let results = await graph.searchNodes(query, 20);

  if (results.length === 0) {
    // Try related terms
    const relatedQueries = [
      query.replace("AI", "artificial intelligence"),
      query.replace("ML", "machine learning"),
      query + " technology",
    ];

    for (const relatedQuery of relatedQueries) {
      results = await graph.searchNodes(relatedQuery, 10);
      if (results.length > 0) break;
    }
  }

  // Filter by similarity threshold
  return results.filter((result) => result.similarity > 0.3);
}
```

#### Multi-Query Search

```javascript
// Search with multiple related queries and combine results
async function multiQuerySearch(queries, limit = 10) {
  const allResults = new Map();

  for (const query of queries) {
    const results = await graph.searchNodes(query, limit);

    results.forEach((result) => {
      const existing = allResults.get(result.node.id);
      if (!existing || result.similarity > existing.similarity) {
        allResults.set(result.node.id, result);
      }
    });
  }

  return Array.from(allResults.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Usage
const results = await multiQuerySearch([
  "machine learning",
  "artificial intelligence",
  "neural networks",
  "deep learning",
], 15);
```

### Content Strategy

#### Embedding-Friendly Content

```javascript
// Structure your content for better embeddings
const optimizedNode = await graph.createNode("research_paper", {
  title: "Deep Learning for Medical Image Analysis",

  // Abstract: perfect for embeddings
  abstract:
    "This paper presents a novel approach to medical image analysis using deep convolutional neural networks. We demonstrate significant improvements in diagnostic accuracy for detecting tumors in MRI scans.",

  // Keywords: explicit semantic markers
  keywords: [
    "deep learning",
    "medical imaging",
    "computer vision",
    "healthcare AI",
    "tumor detection",
  ],

  // Summary: human-readable semantic content
  summary:
    "Breakthrough research showing how artificial intelligence can help doctors diagnose diseases more accurately using medical images.",

  // Methodology: adds context
  methodology:
    "Convolutional neural networks trained on 10,000 annotated medical images",

  // Domain: helps with categorization
  domain: "healthcare technology",

  // Impact: semantic significance
  impact: "Could improve early cancer detection rates by 23%",
});
```

## 🧪 Testing and Debugging

### Embedding Quality Testing

```javascript
// Test embedding quality with known similar content
async function testEmbeddingQuality() {
  // Create test content
  const ai1 = await graph.createNode("article", {
    title: "Machine Learning Basics",
    content:
      "Introduction to artificial intelligence and machine learning algorithms",
  });

  const ai2 = await graph.createNode("article", {
    title: "Deep Learning Guide",
    content: "Advanced neural networks and artificial intelligence techniques",
  });

  const cooking = await graph.createNode("article", {
    title: "Italian Pasta Recipes",
    content: "Traditional cooking methods for authentic Italian cuisine",
  });

  // Test semantic similarity
  const aiResults = await graph.searchNodes("artificial intelligence", 5);
  const cookingResults = await graph.searchNodes("Italian cuisine", 5);

  console.log("AI content similarity:", aiResults[0]?.similarity);
  console.log("Cooking content similarity:", cookingResults[0]?.similarity);

  // AI content should have higher similarity to AI queries
  assert(aiResults[0]?.similarity > cookingResults[0]?.similarity);
}
```

### Search Result Analysis

```javascript
// Analyze search result quality
async function analyzeSearchResults(query) {
  const results = await graph.searchNodes(query, 10);

  console.log(`\\nSearch Results for: "${query}"`);
  console.log("=".repeat(50));

  results.forEach((result, i) => {
    const similarity = (result.similarity * 100).toFixed(1);
    const title = result.node.data.title || result.node.data.name;
    const type = result.node.type;

    console.log(`${i + 1}. [${type}] ${title}`);
    console.log(`   Similarity: ${similarity}%`);
    console.log(
      `   Content: ${result.node.data.content?.substring(0, 100)}...`,
    );
    console.log("");
  });

  // Quality metrics
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) /
    results.length;
  const highQualityResults = results.filter((r) => r.similarity > 0.5).length;

  console.log(`Average Similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
  console.log(`High Quality Results: ${highQualityResults}/${results.length}`);
}

// Test with various queries
await analyzeSearchResults("machine learning");
await analyzeSearchResults("web development");
await analyzeSearchResults("healthcare technology");
```

## 🔮 Advanced Techniques

### Semantic Clustering

```javascript
// Group similar content automatically
async function semanticClustering(threshold = 0.6) {
  const nodes = graph.getNodes();
  const clusters = [];
  const processed = new Set();

  for (const node of nodes) {
    if (processed.has(node.id)) continue;

    // Find similar nodes
    const similar = await graph.searchNodes(node.embedding, nodes.length);
    const cluster = similar
      .filter((result) =>
        result.similarity > threshold && !processed.has(result.node.id)
      )
      .map((result) => result.node);

    if (cluster.length > 1) {
      clusters.push(cluster);
      cluster.forEach((n) => processed.add(n.id));
    }
  }

  return clusters;
}

// Usage
const clusters = await semanticClustering(0.5);
clusters.forEach((cluster, i) => {
  console.log(`Cluster ${i + 1}:`);
  cluster.forEach((node) => {
    console.log(`  - ${node.data.title || node.data.name}`);
  });
});
```

### Content Recommendation

```javascript
// Recommend related content based on user interests
async function recommendContent(userInterests, excludeIds = []) {
  const recommendations = new Map();

  for (const interest of userInterests) {
    const results = await graph.searchNodes(interest, 10);

    results.forEach((result) => {
      if (excludeIds.includes(result.node.id)) return;

      const existing = recommendations.get(result.node.id);
      const score = result.similarity * (userInterests.indexOf(interest) + 1); // Weight by interest order

      if (!existing || score > existing.score) {
        recommendations.set(result.node.id, {
          node: result.node,
          score: score,
          reason: interest,
        });
      }
    });
  }

  return Array.from(recommendations.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// Usage
const userInterests = [
  "machine learning",
  "web development",
  "data visualization",
];
const recommendations = await recommendContent(userInterests);

recommendations.forEach((rec, i) => {
  console.log(
    `${i + 1}. ${rec.node.data.title} (${
      (rec.score * 100).toFixed(1)
    }% - ${rec.reason})`,
  );
});
```

## 🚀 Next Steps

Now that you understand embeddings and semantic search:

1. **[API Reference](./api.md)** - Learn all the search methods
2. **[Framework Integration](./frameworks.md)** - Build search UIs
3. **[Schema Design Guide](./schema-guide.md)** - Optimize for search

## 💡 Key Takeaways

- **Embeddings understand meaning**, not just keywords
- **Rich content** generates better embeddings
- **Semantic search** finds related content even without exact matches
- **Soft links** discover hidden relationships automatically
- **Performance is excellent** - 3-7ms per embedding, 2ms per search
- **Offline-first** - no server dependencies after model download

Ready to build intelligent search experiences? The semantic web awaits! 🌟
