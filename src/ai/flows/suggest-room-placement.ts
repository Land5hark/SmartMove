'use server';

/**
 * @fileOverview Room suggestion AI agent.
 *
 * - suggestRoomPlacement - A function that suggests a room for a box based on its contents.
 * - SuggestRoomPlacementInput - The input type for the suggestRoomPlacement function.
 * - SuggestRoomPlacementOutput - The return type for the suggestRoomPlacement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoomPlacementInputSchema = z.object({
  itemDescription: z
    .string()
    .describe('A description of the items in the box.'),
});
export type SuggestRoomPlacementInput = z.infer<typeof SuggestRoomPlacementInputSchema>;

const SuggestRoomPlacementOutputSchema = z.object({
  suggestedRoom: z.string().describe('The suggested room for the box based on its contents.'),
});
export type SuggestRoomPlacementOutput = z.infer<typeof SuggestRoomPlacementOutputSchema>;

export async function suggestRoomPlacement(input: SuggestRoomPlacementInput): Promise<SuggestRoomPlacementOutput> {
  return suggestRoomPlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoomPlacementPrompt',
  input: {schema: SuggestRoomPlacementInputSchema},
  output: {schema: SuggestRoomPlacementOutputSchema},
  prompt: `You are an AI assistant that suggests the most appropriate room in a house for a box of items, given a description of the items.\n\nSuggest a single room, and nothing else.  For example: "kitchen" or "bedroom 2".\n\nItems: {{{itemDescription}}}`,
});

const suggestRoomPlacementFlow = ai.defineFlow(
  {
    name: 'suggestRoomPlacementFlow',
    inputSchema: SuggestRoomPlacementInputSchema,
    outputSchema: SuggestRoomPlacementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
