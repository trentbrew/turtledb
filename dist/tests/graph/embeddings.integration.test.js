import { assert, assertAlmostEquals, assertEquals, } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { getEmbedding } from "../../core/embeddings.ts";
import { GraphCore } from "../../core/graph.ts";
// Utility to compute cosine similarity
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length)
        return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
// Read guard variable safely (skip if not allowed)
let shouldRun = false;
try {
    shouldRun = Boolean(Deno.env.get("RUN_REAL_EMBED"));
}
catch (_e) {
    // No env permission granted – default to skipping
    shouldRun = false;
}
// Quick warm-up to verify the native model can load (avoids Sharp missing-binary error)
if (shouldRun) {
    try {
        await getEmbedding("probe");
    }
    catch (e) {
        console.warn("[embeddings.integration] Skipping real-embedding tests – model unavailable:", e.message);
        shouldRun = false;
    }
}
if (shouldRun) {
    /**
     * These tests exercise the real embedding model provided by `client-vector-search`.
     * They are slow (first run downloads & loads a WASM model) and require extra
     * permissions:  --allow-read --allow-ffi [--allow-net on the first run] --allow-env
     * Enable them by running:
     *   RUN_REAL_EMBED=1 deno test -A
     */
    Deno.test("getEmbedding produces stable vectors", async () => {
        const v1 = await getEmbedding("hello world");
        const v2 = await getEmbedding("hello world");
        assert(v1.length > 0, "Embedding should have positive dimensionality");
        assertEquals(v1.length, v2.length, "Repeated calls length mismatch");
        for (let i = 0; i < v1.length; i++) {
            assertAlmostEquals(v1[i], v2[i], 1e-6);
        }
    });
    Deno.test("Embeddings reflect semantic similarity", async () => {
        const base = await getEmbedding("hello world");
        const similar = await getEmbedding("hello there");
        const different = await getEmbedding("completely unrelated text");
        const simScore = cosineSimilarity(base, similar);
        const diffScore = cosineSimilarity(base, different);
        assert(simScore > diffScore, `Expected similarity score (${simScore}) to be greater than diff score (${diffScore})`);
    });
    Deno.test("GraphCore.createNode embeds real vector", async () => {
        const graph = new GraphCore(); // uses default getEmbedding
        const node = await graph.createNode("test", { text: "integration" });
        assert("embedding" in node, "Node should contain an embedding property");
        assert(node.embedding.length > 0);
    });
}
//# sourceMappingURL=embeddings.integration.test.js.map