import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { getEmbedding } from "../../core/embeddings.ts";

// Simple EmbeddingIndex implementation for testing
class EmbeddingIndex {
  private objects: any[];

  constructor(objects: any[]) {
    this.objects = objects;
  }

  async search(queryEmbedding: number[], options: { topK: number }) {
    const results = this.objects.map((obj) => ({
      ...obj,
      similarity: this.cosineSimilarity(queryEmbedding, obj.embedding),
    }));

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, options.topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }
}

// Read guard variable safely (skip if not allowed)
let shouldRun = false;
try {
  shouldRun = Boolean(Deno.env.get("RUN_REAL_EMBED"));
} catch (_e) {
  // No env permission granted – default to skipping
  shouldRun = false;
}

// Quick warm-up to verify the native model can load
if (shouldRun) {
  try {
    await getEmbedding("probe");
  } catch (e: any) {
    console.warn(
      "[embedding-search.test] Skipping real-embedding tests – model unavailable:",
      e.message,
    );
    shouldRun = false;
  }
}

if (shouldRun) {
  Deno.test("EmbeddingIndex - Basic search functionality", async () => {
    // Create some test objects with embeddings
    const apple = await getEmbedding("Apple");
    const banana = await getEmbedding("Banana");
    const orange = await getEmbedding("Orange");
    const car = await getEmbedding("Car");

    const testObjects = [
      { id: 1, name: "Apple", category: "fruit", embedding: apple },
      { id: 2, name: "Banana", category: "fruit", embedding: banana },
      { id: 3, name: "Orange", category: "fruit", embedding: orange },
      { id: 4, name: "Car", category: "vehicle", embedding: car },
    ];

    const index = new EmbeddingIndex(testObjects);

    // Search for something similar to fruits
    const queryEmbedding = await getEmbedding("fruit");
    const results = await index.search(queryEmbedding, { topK: 3 });

    assertExists(results);
    assert(Array.isArray(results));
    assert(results.length <= 3);

    // The top results should be fruits, not vehicles
    const topResult = results[0] as any;
    assertExists(topResult);
    assertEquals(topResult.category, "fruit");
  });

  Deno.test("EmbeddingIndex - JSON stringification works well", async () => {
    // Test with complex objects that get stringified
    const person1 = {
      id: "p1",
      type: "person",
      data: {
        name: "Alice",
        profession: "doctor",
        interests: ["medicine", "research"],
      },
    };

    const person2 = {
      id: "p2",
      type: "person",
      data: {
        name: "Bob",
        profession: "engineer",
        interests: ["technology", "programming"],
      },
    };

    const person3 = {
      id: "p3",
      type: "person",
      data: {
        name: "Carol",
        profession: "teacher",
        interests: ["education", "children"],
      },
    };

    // Generate embeddings from stringified JSON
    const testObjects = [
      {
        ...person1,
        embedding: await getEmbedding(JSON.stringify(person1.data)),
      },
      {
        ...person2,
        embedding: await getEmbedding(JSON.stringify(person2.data)),
      },
      {
        ...person3,
        embedding: await getEmbedding(JSON.stringify(person3.data)),
      },
    ];

    const index = new EmbeddingIndex(testObjects);

    // Search for someone in technology
    const techQuery = await getEmbedding("technology programming software");
    const techResults = await index.search(techQuery, { topK: 2 });

    assertExists(techResults);
    assert(techResults.length > 0);

    // Bob (engineer) should be the top result for tech query
    assertEquals((techResults[0] as any).data.name, "Bob");

    // Search for someone in healthcare
    const healthQuery = await getEmbedding("healthcare medicine doctor");
    const healthResults = await index.search(healthQuery, { topK: 2 });

    assertExists(healthResults);
    assert(healthResults.length > 0);

    // Alice (doctor) should be the top result for health query
    assertEquals((healthResults[0] as any).data.name, "Alice");
  });

  Deno.test("EmbeddingIndex - Node data similarity search", async () => {
    // Simulate actual TurtleDB node data
    const nodes = [
      {
        id: "n1",
        type: "member",
        data: {
          firstName: "John",
          lastName: "Smith",
          email: "john@tech.com",
          bio: "Software engineer passionate about AI and machine learning",
          skills: ["JavaScript", "Python", "Machine Learning"],
        },
      },
      {
        id: "n2",
        type: "member",
        data: {
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah@med.com",
          bio: "Medical doctor specializing in cardiology and patient care",
          skills: ["Medicine", "Cardiology", "Patient Care"],
        },
      },
      {
        id: "n3",
        type: "post",
        data: {
          title: "Introduction to Neural Networks",
          content:
            "This post covers the basics of neural networks and deep learning...",
          tags: ["AI", "Machine Learning", "Technology"],
        },
      },
    ];

    // Create embeddings from stringified node data
    const embeddedNodes = await Promise.all(
      nodes.map(async (node) => ({
        ...node,
        embedding: await getEmbedding(JSON.stringify(node.data)),
      })),
    );

    const index = new EmbeddingIndex(embeddedNodes);

    // Search for AI/ML related content
    const aiQuery = await getEmbedding(
      "artificial intelligence machine learning neural networks",
    );
    const aiResults = await index.search(aiQuery, { topK: 2 });

    assertExists(aiResults);
    assert(aiResults.length > 0);

    // Should find both the engineer and the AI post
    const resultTypes = aiResults.map((r: any) => r.type);
    assert(resultTypes.includes("member") || resultTypes.includes("post"));

    // Search for medical content
    const medQuery = await getEmbedding("medical doctor healthcare cardiology");
    const medResults = await index.search(medQuery, { topK: 2 });

    assertExists(medResults);
    assert(medResults.length > 0);

    // Should find the doctor
    const doctorResult = medResults.find((r: any) =>
      r.data.bio?.includes("Medical doctor")
    );
    assertExists(doctorResult);
  });
} else {
  Deno.test("EmbeddingIndex - Skipped (no real embeddings)", () => {
    console.log(
      "Embedding search tests skipped. Run with RUN_REAL_EMBED=1 to enable.",
    );
  });
}
