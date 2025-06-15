/**
 * Real embeddings implementation using @xenova/transformers
 * This provides high-quality sentence embeddings using the all-MiniLM-L6-v2 model
 * which is optimized for semantic similarity tasks.
 */
/**
 * Generate embeddings for a given text using transformers.js
 * @param text The input text to embed
 * @returns Promise<number[]> A 384-dimensional embedding vector
 */
export declare function getEmbedding(text: string): Promise<number[]>;
/**
 * Check if real embeddings are available
 * @returns Promise<boolean> True if real embeddings can be generated
 */
export declare function isRealEmbeddingsAvailable(): Promise<boolean>;
/**
 * Calculate cosine similarity between two embeddings
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns number Cosine similarity (-1 to 1)
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
//# sourceMappingURL=embeddings.d.ts.map