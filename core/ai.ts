import { generateText as aiGenerateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateText(prompt: string): Promise<string> {
  const result = await aiGenerateText({
    model: openai.chat('gpt-4o-mini'),
    prompt,
  });
  return result.text as string;
}
