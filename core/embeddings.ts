import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Returns a single embedding object (number[]) for the given value
export async function getEmbedding(value: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value,
  });
  return embedding;
}
