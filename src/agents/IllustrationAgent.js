import { base44 } from "@/api/base44Client";

/**
 * Illustration Agent
 * Handles the "creative" work of analyzing book text and generating illustrations.
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

        // 1. Contextualize
        // If we extracted real text from PDF, we would use it here.
        // For now, we simulate the "reading" of the page by asking the LLM to imagine it based on the title.
        const contextPrompt = pageText
            ? `Page content: "${pageText}"`
            : `This is page ${pageNumber} of the book "${bookTitle}".`;

        // 2. Invoke LLM for the Creative Prompt
        const llmPrompt = `
            You are an expert book illustrator.
            ${contextPrompt}
            
            Create a detailed, atmospheric illustration prompt for this page.
            Style: Vintage, etching, 19th-century classic literature style, black and white or sepia.
            Focus: High contrast, mood, no text, key event or setting.
            
            Respond with ONLY the image generation prompt.
        `;

        const illustrationPrompt = await base44.integrations.Core.InvokeLLM({
            prompt: llmPrompt,
            add_context_from_internet: false
        });

        console.log(`[IllustrationAgent] Generated Prompt:`, illustrationPrompt);

        // 3. Generate Image
        const imageResponse = await base44.integrations.Core.GenerateImage({
            prompt: `${illustrationPrompt}. Style: Classic book etching, ink drawing, highly detailed, black and white, woodcut style.`
        });

        console.log(`[IllustrationAgent] Generated Image:`, imageResponse.url);

        return {
            url: imageResponse.url,
            prompt: illustrationPrompt
        };
    }
};
