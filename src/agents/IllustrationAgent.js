import { generateIllustrationPrompt } from "@/api/geminiClient";

/**
 * Illustration Agent
 * Handles the "creative" work of analyzing book text and generating illustrations.
 * Uses Gemini (Text) + Pollinations.ai (Image).
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

        // 1. Generate Creative Prompt using Gemini
        let illustrationPrompt;
        try {
            illustrationPrompt = await generateIllustrationPrompt(bookTitle, pageNumber, pageText);
        } catch (error) {
            console.error("Gemini Prompt Generation failed, falling back to simple prompt.", error);
            illustrationPrompt = `Vintage etching of a scene from ${bookTitle}, page ${pageNumber}. Classic book illustration style.`;
        }

        console.log(`[IllustrationAgent] Generated Prompt:`, illustrationPrompt);

        // 2. Generate Image using Pollinations.ai (Free, No Key)
        // We ensure the style is baked into the final image prompt
        const finalImagePrompt = `${illustrationPrompt} style: vintage etching, ink drawing, woodcut, black and white, high detailed, masterpiece`;
        const encodedPrompt = encodeURIComponent(finalImagePrompt);

        // Add random seed to ensure unique images if retried
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1200&model=flux&seed=${seed}&nologo=true`;

        console.log(`[IllustrationAgent] Generated Image URL:`, imageUrl);

        // Simulate a short wait to make it feel like "work" and ensure URL is ready (optional, but good UX)
        // Pollinations is instant, so we don't strictly need to wait, but returning immediately is fine.

        return {
            url: imageUrl,
            prompt: illustrationPrompt
        };
    }
};
