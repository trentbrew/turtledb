# 🚀 Getting Started with TurtleDB

Welcome to TurtleDB! This guide will walk you through creating your first
semantic graph database in just a few minutes.

## 📋 Prerequisites

- **Node.js 18+** - TurtleDB requires modern Node.js features
- **npm or yarn** - For package management
- **Basic JavaScript knowledge** - Familiarity with async/await and ES modules

## 🛠️ Installation

```bash
npm install turtle-db
```

That's it! TurtleDB has minimal dependencies and works offline after the initial
model download.

## 🏗️ Your First Graph

Let's build a simple knowledge management system to demonstrate TurtleDB's
capabilities.

### Step 1: Define Your Schema

Create a new file `my-graph.js`:

```javascript
import { GraphCore } from "turtle-db";

// Define what types of data you want to store
const schema = {
  node_types: {
    // People in your system
    person: {
      name: "person",
      description: "A person who creates or consumes content",
      data: {
        name: { type: "string", required: true },
        email: { type: "string", required: false },
        expertise: { type: "array", required: false },
      },
    },

    // Articles or documents
    article: {
      name: "article",
      description: "A piece of written content",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        category: {
          type: "string",
          enum: ["technology", "science", "business", "health"],
          required: true,
        },
        publishedAt: { type: "string", required: false },
      },
    },

    // Topics or concepts
    topic: {
      name: "topic",
      description: "A subject or area of knowledge",
      data: {
        name: { type: "string", required: true },
        description: { type: "string", required: false },
      },
    },
  },

  edge_types: {
    // Who wrote what
    authored: {
      name: "authored",
      description: "Person authored an article",
      source: { node_type: "person", multiple: true, required: false },
      target: { node_type: "article", multiple: false, required: false },
      data: {
        role: { type: "string", required: false }, // e.g., "primary author", "contributor"
      },
    },

    // What articles cover which topics
    covers: {
      name: "covers",
      description: "Article covers a topic",
      source: { node_type: "article", multiple: true, required: false },
      target: { node_type: "topic", multiple: true, required: false },
      data: {
        relevance: {
          type: "string",
          enum: ["primary", "secondary", "mentioned"],
          required: false,
        },
      },
    },

    // Who is interested in what topics
    interested_in: {
      name: "interested_in",
      description: "Person is interested in a topic",
      source: { node_type: "person", multiple: true, required: false },
      target: { node_type: "topic", multiple: true, required: false },
      data: {
        level: {
          type: "string",
          enum: ["beginner", "intermediate", "expert"],
          required: false,
        },
      },
    },
  },
};

export { schema };
```

### Step 2: Initialize Your Graph

```javascript
// Initialize the graph with your schema
const graph = new GraphCore(schema);

// Optional: Listen to events to see what's happening
graph.on("node:add", (node) => {
  console.log(`✅ Added ${node.type}: ${node.data.name || node.data.title}`);
});

graph.on("edge:add", (edge) => {
  console.log(`🔗 Created relationship: ${edge.type}`);
});

console.log("🐢 TurtleDB initialized with schema validation!");
```

### Step 3: Add Some Data

```javascript
async function populateGraph() {
  console.log("📝 Adding people...");

  // Create people
  const alice = await graph.createNode("person", {
    name: "Dr. Alice Chen",
    email: "alice@university.edu",
    expertise: ["machine learning", "computer vision", "medical AI"],
  });

  const bob = await graph.createNode("person", {
    name: "Bob Martinez",
    email: "bob@techcorp.com",
    expertise: ["web development", "user experience", "accessibility"],
  });

  console.log("📚 Adding topics...");

  // Create topics
  const aiTopic = await graph.createNode("topic", {
    name: "Artificial Intelligence",
    description: "The simulation of human intelligence in machines",
  });

  const webTopic = await graph.createNode("topic", {
    name: "Web Development",
    description: "Building applications and websites for the internet",
  });

  const healthTopic = await graph.createNode("topic", {
    name: "Healthcare Technology",
    description: "Technology applications in medical and health fields",
  });

  console.log("📄 Adding articles...");

  // Create articles with rich content
  const aiArticle = await graph.createNode("article", {
    title: "Deep Learning in Medical Diagnosis",
    content:
      "Recent advances in deep learning have revolutionized medical diagnosis. Convolutional neural networks can now detect diseases in medical images with accuracy matching or exceeding human specialists. This breakthrough has significant implications for healthcare accessibility and early disease detection.",
    category: "technology",
    publishedAt: "2024-03-15",
  });

  const webArticle = await graph.createNode("article", {
    title: "Building Accessible Web Applications",
    content:
      "Web accessibility ensures that websites and applications are usable by people with disabilities. This includes proper semantic HTML, keyboard navigation, screen reader compatibility, and inclusive design principles. Modern frameworks provide excellent tools for building accessible applications from the ground up.",
    category: "technology",
    publishedAt: "2024-03-10",
  });

  const healthArticle = await graph.createNode("article", {
    title: "The Future of Telemedicine",
    content:
      "Telemedicine has transformed healthcare delivery, especially following the global pandemic. Remote consultations, digital health monitoring, and AI-powered diagnostic tools are making healthcare more accessible and efficient. The integration of wearable devices and mobile health apps continues to expand possibilities.",
    category: "health",
    publishedAt: "2024-03-20",
  });

  console.log("🔗 Creating relationships...");

  // Create authorship relationships
  graph.createEdge("authored", alice.id, aiArticle.id, {
    role: "primary author",
  });

  graph.createEdge("authored", bob.id, webArticle.id, {
    role: "primary author",
  });

  graph.createEdge("authored", alice.id, healthArticle.id, {
    role: "contributor",
  });

  // Create topic coverage relationships
  graph.createEdge("covers", aiArticle.id, aiTopic.id, {
    relevance: "primary",
  });

  graph.createEdge("covers", aiArticle.id, healthTopic.id, {
    relevance: "secondary",
  });

  graph.createEdge("covers", webArticle.id, webTopic.id, {
    relevance: "primary",
  });

  graph.createEdge("covers", healthArticle.id, healthTopic.id, {
    relevance: "primary",
  });

  // Create interest relationships
  graph.createEdge("interested_in", alice.id, aiTopic.id, {
    level: "expert",
  });

  graph.createEdge("interested_in", alice.id, healthTopic.id, {
    level: "expert",
  });

  graph.createEdge("interested_in", bob.id, webTopic.id, {
    level: "expert",
  });

  console.log("✅ Graph populated successfully!");

  return {
    alice,
    bob,
    aiTopic,
    webTopic,
    healthTopic,
    aiArticle,
    webArticle,
    healthArticle,
  };
}

// Run the population
const entities = await populateGraph();
```

### Step 4: Explore with Semantic Search

Now comes the magic! TurtleDB automatically generated embeddings for all your
content. Let's search by meaning:

```javascript
async function exploreGraph() {
  console.log("🔍 Exploring with semantic search...");

  // Search for AI-related content
  console.log('\\n🤖 Searching for "machine learning algorithms"...');
  const aiResults = await graph.searchNodes("machine learning algorithms", 3);
  aiResults.forEach((result, i) => {
    const similarity = (result.similarity * 100).toFixed(1);
    const title = result.node.data.name || result.node.data.title;
    console.log(
      `  ${i + 1}. ${result.node.type}: "${title}" (${similarity}% match)`,
    );
  });

  // Search for healthcare content
  console.log('\\n🏥 Searching for "medical technology"...');
  const healthResults = await graph.searchNodes("medical technology", 3);
  healthResults.forEach((result, i) => {
    const similarity = (result.similarity * 100).toFixed(1);
    const title = result.node.data.name || result.node.data.title;
    console.log(
      `  ${i + 1}. ${result.node.type}: "${title}" (${similarity}% match)`,
    );
  });

  // Search for web development content
  console.log('\\n🌐 Searching for "user interface design"...');
  const webResults = await graph.searchNodes("user interface design", 3);
  webResults.forEach((result, i) => {
    const similarity = (result.similarity * 100).toFixed(1);
    const title = result.node.data.name || result.node.data.title;
    console.log(
      `  ${i + 1}. ${result.node.type}: "${title}" (${similarity}% match)`,
    );
  });
}

await exploreGraph();
```

### Step 5: Discover Automatic Relationships

TurtleDB can find hidden connections in your data:

```javascript
async function discoverConnections() {
  console.log("\\n🔗 Discovering automatic relationships...");

  // Generate soft links based on semantic similarity
  await graph.generateSoftLinks();

  if (graph.softLinks.length > 0) {
    console.log(`Found ${graph.softLinks.length} automatic connections:`);

    graph.softLinks.forEach((link, i) => {
      const sourceNode = graph.getNodes().find((n) => n.id === link.sourceId);
      const targetNode = graph.getNodes().find((n) => n.id === link.targetId);
      const similarity = (link.score * 100).toFixed(1);

      if (sourceNode && targetNode) {
        const sourceName = sourceNode.data.name || sourceNode.data.title;
        const targetName = targetNode.data.name || targetNode.data.title;
        console.log(
          `  ${
            i + 1
          }. "${sourceName}" ↔ "${targetName}" (${similarity}% similar)`,
        );
      }
    });
  } else {
    console.log(
      "No automatic connections found (similarity threshold not met)",
    );
  }
}

await discoverConnections();
```

### Step 6: Analyze Your Graph

```javascript
function analyzeGraph() {
  console.log("\\n📊 Graph Analysis:");

  const stats = graph.getStats();
  console.log(`  • Total Nodes: ${stats.nodes}`);
  console.log(`  • Total Edges: ${stats.edges}`);
  console.log(`  • Node Types: ${stats.nodeTypes}`);
  console.log(`  • Edge Types: ${stats.edgeTypes}`);
  console.log(`  • Soft Links: ${stats.softLinks}`);

  // Find the most connected nodes
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  const connectionCounts = new Map();

  edges.forEach((edge) => {
    connectionCounts.set(
      edge.sourceNodeId,
      (connectionCounts.get(edge.sourceNodeId) || 0) + 1,
    );
    connectionCounts.set(
      edge.targetNodeId,
      (connectionCounts.get(edge.targetNodeId) || 0) + 1,
    );
  });

  console.log("\\n🌟 Most Connected Entities:");
  const sortedConnections = Array.from(connectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  sortedConnections.forEach(([nodeId, count], i) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const name = node.data.name || node.data.title;
      console.log(`  ${i + 1}. ${node.type}: "${name}" (${count} connections)`);
    }
  });
}

analyzeGraph();
```

### Step 7: Save Your Work

```javascript
async function saveGraph() {
  console.log("\\n💾 Saving graph...");
  await graph.save();
  console.log("✅ Graph saved successfully!");

  // Test loading
  console.log("🧪 Testing reload...");
  const newGraph = new GraphCore(schema);
  await newGraph.load();

  const newStats = newGraph.getStats();
  console.log(`✅ Reloaded: ${newStats.nodes} nodes, ${newStats.edges} edges`);
}

await saveGraph();
```

## 🎯 Complete Example

Here's the complete working example:

```javascript
import { GraphCore } from "turtle-db";

// [Include the complete schema from Step 1]
const schema = {/* ... */};

async function main() {
  // Initialize
  const graph = new GraphCore(schema);

  // Add event listeners
  graph.on("node:add", (node) => {
    console.log(`✅ Added ${node.type}: ${node.data.name || node.data.title}`);
  });

  // Populate with data
  const entities = await populateGraph();

  // Explore with semantic search
  await exploreGraph();

  // Discover connections
  await discoverConnections();

  // Analyze
  analyzeGraph();

  // Save
  await saveGraph();

  console.log(
    "\\n🎉 Tutorial complete! You now have a working semantic graph database.",
  );
}

main().catch(console.error);
```

## 🚀 Next Steps

Congratulations! You've built your first semantic graph database. Here's what to
explore next:

1. **[Schema Design Guide](./schema-guide.md)** - Learn advanced schema patterns
2. **[Embedding & Search Guide](./embeddings.md)** - Deep dive into semantic
   search
3. **[Framework Integration](./frameworks.md)** - Connect to React, Vue, or
   Svelte
4. **[API Reference](./api.md)** - Complete method documentation

## 💡 Key Takeaways

- **Schema-first design** ensures data consistency and type safety
- **Automatic embeddings** enable semantic search without configuration
- **Event-driven architecture** makes your app reactive to data changes
- **Soft links** discover hidden relationships in your data
- **Framework-agnostic** design works with any JavaScript environment

Ready to build something amazing? Let's go! 🚀
