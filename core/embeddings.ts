// import { embed } from 'ai';
// import { openai } from '@ai-sdk/openai';

import { getEmbedding as embedding } from 'client-vector-search';

/**
 * Returns a single embedding object (a vector of numbers) for the given value.
 * This implementation uses a client-side transformer model to generate embeddings.
 * @param value The string to get an embedding for.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export async function getEmbedding(value: string): Promise<number[]> {
  return await embedding(value);
}
