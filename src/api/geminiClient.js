import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.warn("VITE_GEMINI_API_KEY is missing. Illustration prompts will use a fallback.");
}

/**
 * Generates a creative prompt for a book illustration using Gemini.
 * @param {string} bookTitle 
 * @param {number} pageNumber 
 * @param {string} pageText 
 * @returns {Promise<string>}
 */
export async function generateIllustrationPrompt(bookTitle, pageNumber, pageText = "") {
    if (!model) {
        console.error("Gemini API Key missing");
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    const prompt = `
    You are an expert book illustrator.
    Context:
    Book Title: "${bookTitle}"
    Page Number: ${pageNumber}
    ${pageText ? `Page Text excerpt: "${pageText}"` : "Imagine a scene fitting for this page."}

    Task:
    Create a detailed, atmospheric, visual description for an illustration of this page.
    Style: Vintage, etching, 19th-century classic literature style, black and white or sepia, high contrast, woodcut.
    
    Constraint: 
    Respond with ONLY the visual description string. Do not include "Here is a prompt" or quotes.
    Keep it under 40 words, focused on visual elements.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text.trim();
    } catch (error) {
        console.error("Gemini generation failed:", error);
        throw new Error("Failed to generate prompt with Gemini.");
    }
}
