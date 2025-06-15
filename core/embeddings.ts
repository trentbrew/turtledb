/**
 * Real embeddings implementation using @xenova/transformers
 * This provides high-quality sentence embeddings using the all-MiniLM-L6-v2 model
 * which is optimized for semantic similarity tasks.
 */

import { env, pipeline } from "@xenova/transformers";

// Allow remote models for initial download, then cache locally
env.allowRemoteModels = true;
env.allowLocalModels = true;

let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function initEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log("Loading embedding model (all-MiniLM-L6-v2)...");
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        quantized: true, // Use quantized model for better performance
        progress_callback: (progress: any) => {
          if (progress.status === "downloading") {
            console.log(
              `Downloading model: ${Math.round(progress.progress || 0)}%`,
            );
          }
        },
      },
    );
    console.log("✅ Embedding model loaded successfully!");
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a given text using transformers.js
 * @param text The input text to embed
 * @returns Promise<number[]> A 384-dimensional embedding vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const pipeline = await initEmbeddingPipeline();

    // Generate embeddings
    const result = await pipeline(text, { pooling: "mean", normalize: true });

    // Convert tensor to regular array
    const embedding = Array.from(result.data) as number[];

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Fallback to deterministic hash-based embedding
    return generateDeterministicEmbedding(text);
  }
}

/**
 * Check if real embeddings are available
 * @returns Promise<boolean> True if real embeddings can be generated
 */
export async function isRealEmbeddingsAvailable(): Promise<boolean> {
  try {
    await initEmbeddingPipeline();
    return true;
  } catch (error) {
    console.warn(
      "Real embeddings not available, falling back to deterministic embeddings",
    );
    return false;
  }
}

/**
 * Fallback: Generate deterministic hash-based embeddings
 * This provides consistent, discriminative embeddings when real models aren't available
 */
function generateDeterministicEmbedding(text: string): number[] {
  const dimension = 384; // Match all-MiniLM-L6-v2 dimensions
  const embedding = new Array(dimension).fill(0);

  // Create a simple hash-based embedding
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    const index = (char * (i + 1)) % dimension;
    embedding[index] += Math.sin(char * 0.1) * Math.cos(i * 0.1);
  }

  // Normalize the vector
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns number Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
