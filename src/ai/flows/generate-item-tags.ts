// Implemented image recognition to automatically identify and tag items in a moving box.
'use server';

/**
 * @fileOverview AI-powered item tag generator for moving box contents.
 *
 * - generateItemTags - A function that handles the item tagging process.
 * - GenerateItemTagsInput - The input type for the generateItemTags function.
 * - GenerateItemTagsOutput - The return type for the generateItemTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItemTagsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the contents of a moving box, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateItemTagsInput = z.infer<typeof GenerateItemTagsInputSchema>;

const GenerateItemTagsOutputSchema = z.object({
  itemTags: z.array(
    z.string().describe('A list of item tags identified in the photo.')
  ).describe('List of tags for items in the box.')
});
export type GenerateItemTagsOutput = z.infer<typeof GenerateItemTagsOutputSchema>;

export async function generateItemTags(input: GenerateItemTagsInput): Promise<GenerateItemTagsOutput> {
  return generateItemTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItemTagsPrompt',
  input: {schema: GenerateItemTagsInputSchema},
  output: {schema: GenerateItemTagsOutputSchema},
  prompt: `You are an expert moving assistant. Your job is to identify and tag the individual items within a moving box based on a photo.

  Here is a photo of the box contents:
  {{media url=photoDataUri}}

  Based on the image, generate a list of item tags.
  The itemTags field in the output should be a list of strings.
  Example: ["books", "picture frames", "lamp"]
  `,
});

const generateItemTagsFlow = ai.defineFlow(
  {
    name: 'generateItemTagsFlow',
    inputSchema: GenerateItemTagsInputSchema,
    outputSchema: GenerateItemTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
