import { generateIllustrationPrompt, generateImage } from "@/api/openaiClient";

/**
 * Illustration Agent
 * Handles the "creative" work of analyzing book text and generating illustrations.
 * Uses OpenAI (GPT-4o + DALL-E 3).
 */
export const IllustrationAgent = {
    /**
     * core generation logic
     * @param {string} bookTitle 
     * @param {number} pageNumber 
     * @param {string} pageText (Optional context from the page)
     * @returns {Promise<{url: string, prompt: string}>}
     */
    generateValues: async (bookTitle, pageNumber, pageText = "") => {
        console.log(`[IllustrationAgent] Starting work for ${bookTitle} page ${pageNumber}`);

        // 1. Generate Creative Prompt using GPT-4o
        let illustrationPrompt;
        try {
            illustrationPrompt = await generateIllustrationPrompt(bookTitle, pageNumber, pageText);
        } catch (error) {
            console.error("OpenAI Prompt Generation failed, falling back to simple prompt.", error);
            illustrationPrompt = `Vintage etching of a scene from ${bookTitle}, page ${pageNumber}. Classic book illustration style.`;
        }

        console.log(`[IllustrationAgent] Generated Prompt:`, illustrationPrompt);

        // 2. Generate Image using DALL-E 3
        try {
            // We ensure the style is baked into the final image prompt
            const finalImagePrompt = `${illustrationPrompt}. Style: vintage etching, ink drawing, woodcut, black and white, highly detailed, masterpiece.`;

            const result = await generateImage(finalImagePrompt);
            console.log(`[IllustrationAgent] Generated Image URL:`, result.url);

            return {
                url: result.url,
                prompt: illustrationPrompt
            };
        } catch (error) {
            console.error("OpenAI Image Generation failed:", error);
            throw error; // Let the caller handle the failure (e.g. show error toast)
        }
    }
};
