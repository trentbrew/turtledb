#!/usr/bin/env -S deno run -A
import { GraphCore } from "./core/graph.ts";
import { schema } from "./tests/schema.example.ts";
import { getEmbedding } from "./core/embeddings.ts";
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};
function colorJSON(v) {
    return JSON.stringify(v, null, 2)
        .replace(/"([^\"]+)":/g, `${colors.blue}"$1"${colors.reset}:`)
        .replace(/: "([^\"]+)"/g, `: ${colors.green}"$1"${colors.reset}`)
        .replace(/: (\d+)/g, `: ${colors.yellow}$1${colors.reset}`)
        .replace(/: (true|false)/g, `: ${colors.magenta}$1${colors.reset}`)
        .replace(/: null/g, `: ${colors.gray}null${colors.reset}`);
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
async function demo() {
    console.log(`${colors.cyan}🐢 TurtleDB Demo${colors.reset}\n`);
    // Initialize graph
    console.log(`${colors.bright}1. Initializing Graph${colors.reset}`);
    const graph = new GraphCore(schema);
    console.log(`✅ Graph initialized with schema`);
    console.log(`📊 Available node types: ${Object.keys(schema.node_types).join(", ")}`);
    console.log(`📊 Available edge types: ${Object.keys(schema.edge_types).join(", ")}\n`);
    // Test embeddings
    console.log(`${colors.bright}2. Testing Embeddings${colors.reset}`);
    const embedding1 = await getEmbedding("artificial intelligence machine learning");
    const embedding2 = await getEmbedding("medical doctor healthcare");
    const embedding3 = await getEmbedding("software engineer programming");
    console.log(`✅ Generated embeddings (${embedding1.length} dimensions)`);
    console.log(`🔗 AI vs Medical similarity: ${cosineSimilarity(embedding1, embedding2).toFixed(4)}`);
    console.log(`🔗 AI vs Programming similarity: ${cosineSimilarity(embedding1, embedding3).toFixed(4)}`);
    console.log(`🔗 Medical vs Programming similarity: ${cosineSimilarity(embedding2, embedding3).toFixed(4)}\n`);
    // Create nodes
    console.log(`${colors.bright}3. Creating Nodes${colors.reset}`);
    const alice = await graph.createNode("member", {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@hospital.com",
        isActive: true,
    });
    console.log(`✅ Created member: ${colors.green}${alice.id}${colors.reset}`);
    const bob = await graph.createNode("member", {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@tech.com",
        isActive: true,
    });
    console.log(`✅ Created member: ${colors.green}${bob.id}${colors.reset}`);
    // Create authors (separate from members)
    const aliceAuthor = await graph.createNode("author", {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@hospital.com",
        isActive: true,
    });
    console.log(`✅ Created author: ${colors.green}${aliceAuthor.id}${colors.reset}`);
    const bobAuthor = await graph.createNode("author", {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@tech.com",
        isActive: true,
    });
    console.log(`✅ Created author: ${colors.green}${bobAuthor.id}${colors.reset}`);
    const post1 = await graph.createNode("post", {
        title: "Introduction to Neural Networks",
        content: "This comprehensive guide covers the fundamentals of neural networks, deep learning architectures, and practical applications in modern AI systems.",
        published: true,
    });
    console.log(`✅ Created post: ${colors.green}${post1.id}${colors.reset}`);
    const publication1 = await graph.createNode("publication", {
        title: "Advances in Cardiology",
        content: "Recent breakthroughs in cardiovascular medicine, including new surgical techniques and diagnostic tools for heart disease prevention.",
        published: true,
    });
    console.log(`✅ Created publication: ${colors.green}${publication1.id}${colors.reset}\n`);
    // Create edges
    console.log(`${colors.bright}4. Creating Relationships${colors.reset}`);
    const wroteEdge1 = await graph.createEdge("wrote", bobAuthor.id, publication1.id, {});
    console.log(`✅ Created edge: ${colors.green}${bobAuthor.id}${colors.reset} wrote ${colors.green}${publication1.id}${colors.reset}\n`);
    // Show graph statistics
    console.log(`${colors.bright}5. Graph Statistics${colors.reset}`);
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    console.log(`📊 Total nodes: ${colors.yellow}${nodes.length}${colors.reset}`);
    console.log(`📊 Total edges: ${colors.yellow}${edges.length}${colors.reset}`);
    const nodeTypes = nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
    }, {});
    console.log(`📊 Node types:`);
    for (const [type, count] of Object.entries(nodeTypes)) {
        console.log(`   ${colors.blue}${type}${colors.reset}: ${count}`);
    }
    console.log();
    // Semantic search demo
    console.log(`${colors.bright}6. Semantic Search Demo${colors.reset}`);
    // Search for AI-related content
    console.log(`🔍 Searching for: "artificial intelligence programming"`);
    const aiQuery = await getEmbedding("artificial intelligence programming");
    const aiResults = [];
    for (const node of nodes) {
        if ("embedding" in node && node.embedding) {
            const similarity = cosineSimilarity(aiQuery, node.embedding);
            aiResults.push({ node, similarity });
        }
    }
    aiResults.sort((a, b) => b.similarity - a.similarity);
    console.log(`📋 Top AI-related results:`);
    aiResults.slice(0, 3).forEach((result, i) => {
        const { node, similarity } = result;
        console.log(`   ${i + 1}. ${colors.green}${node.id}${colors.reset} (${node.type}) - similarity: ${similarity.toFixed(4)}`);
        if (node.type === "member" || node.type === "author") {
            console.log(`      👤 ${node.data.firstName} ${node.data.lastName} - ${node.data.email}`);
        }
        else if (node.type === "post" || node.type === "publication") {
            console.log(`      📝 ${node.data.title} - ${node.data.content?.slice(0, 50)}...`);
        }
    });
    console.log();
    // Search for medical content
    console.log(`🔍 Searching for: "medical healthcare doctor"`);
    const medQuery = await getEmbedding("medical healthcare doctor");
    const medResults = [];
    for (const node of nodes) {
        if ("embedding" in node && node.embedding) {
            const similarity = cosineSimilarity(medQuery, node.embedding);
            medResults.push({ node, similarity });
        }
    }
    medResults.sort((a, b) => b.similarity - a.similarity);
    console.log(`📋 Top medical-related results:`);
    medResults.slice(0, 3).forEach((result, i) => {
        const { node, similarity } = result;
        console.log(`   ${i + 1}. ${colors.green}${node.id}${colors.reset} (${node.type}) - similarity: ${similarity.toFixed(4)}`);
        if (node.type === "member" || node.type === "author") {
            console.log(`      👤 ${node.data.firstName} ${node.data.lastName} - ${node.data.email}`);
        }
        else if (node.type === "post" || node.type === "publication") {
            console.log(`      📝 ${node.data.title} - ${node.data.content?.slice(0, 50)}...`);
        }
    });
    console.log();
    // Show detailed node information
    console.log(`${colors.bright}7. Detailed Node Inspection${colors.reset}`);
    console.log(`🔍 Inspecting node: ${colors.green}${alice.id}${colors.reset}`);
    console.log(colorJSON({
        id: alice.id,
        type: alice.type,
        data: alice.data,
        hasEmbedding: "embedding" in alice,
        embeddingLength: "embedding" in alice
            ? alice.embedding.length
            : 0,
    }));
    console.log();
    // Show connected edges
    console.log(`${colors.bright}8. Relationship Analysis${colors.reset}`);
    const aliceEdges = edges.filter((e) => e.sourceNodeId === alice.id || e.targetNodeId === alice.id);
    console.log(`🔗 ${colors.green}${alice.id}${colors.reset} has ${aliceEdges.length} connection(s):`);
    aliceEdges.forEach((edge) => {
        const isOutgoing = edge.sourceNodeId === alice.id;
        const otherNodeId = isOutgoing ? edge.targetNodeId : edge.sourceNodeId;
        const otherNode = nodes.find((n) => n.id === otherNodeId);
        const direction = isOutgoing ? "→" : "←";
        console.log(`   ${direction} ${colors.blue}${edge.type}${colors.reset} ${colors.green}${otherNodeId}${colors.reset}`);
        if (otherNode?.type === "post" || otherNode?.type === "publication") {
            console.log(`      📝 "${otherNode.data.title}"`);
        }
    });
    console.log();
    console.log(`${colors.bright}✨ Demo Complete!${colors.reset}`);
    console.log(`${colors.gray}TurtleDB successfully demonstrated:${colors.reset}`);
    console.log(`${colors.gray}  ✓ Schema-based node/edge creation${colors.reset}`);
    console.log(`${colors.gray}  ✓ Deterministic embedding generation${colors.reset}`);
    console.log(`${colors.gray}  ✓ Semantic similarity search${colors.reset}`);
    console.log(`${colors.gray}  ✓ Graph relationship analysis${colors.reset}`);
}
if (import.meta.main) {
    await demo();
}
//# sourceMappingURL=demo.js.map